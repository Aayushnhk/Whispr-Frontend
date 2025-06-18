// src/app/components/chat/MessageInput.tsx
"use client";

import React, { SetStateAction, useState, useRef } from "react";
import Image from "next/image";
import { Message } from "@/types";
import {
  PaperAirplaneIcon,
  MicrophoneIcon,
  StopCircleIcon,
} from "@heroicons/react/24/solid";
import { FaceSmileIcon } from "@heroicons/react/24/outline";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

interface MessageInputProps {
  messageInput: string;
  setMessageInput: React.Dispatch<SetStateAction<string>>;
  selectedFile: File | null;
  setSelectedFile: React.Dispatch<SetStateAction<File | null>>;
  filePreview: string | null;
  setFilePreview: React.Dispatch<SetStateAction<string | null>>;
  isUploadingFile: boolean;
  setIsUploadingFile: React.Dispatch<SetStateAction<boolean>>;
  fileUploadError: string | null;
  setFileUploadError: React.Dispatch<SetStateAction<string | null>>;
  typingMessage: string;
  replyingTo: Message | null;
  setReplyingTo: React.Dispatch<SetStateAction<Message | null>>;
  sendMessage: () => void;
  handleMessageInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleProfilePictureUpload: (file: File) => void;
  className?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_URL || "";

const MessageInput: React.FC<MessageInputProps> = ({
  messageInput,
  setMessageInput,
  selectedFile,
  setSelectedFile,
  filePreview,
  setFilePreview,
  isUploadingFile,
  setIsUploadingFile,
  fileUploadError,
  setFileUploadError,
  typingMessage,
  replyingTo,
  setReplyingTo,
  sendMessage,
  handleMessageInputChange,
  handleFileChange,
  fileInputRef,
  handleProfilePictureUpload,
  className = "",
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleEmojiSelect = (emoji: any) => {
    setMessageInput((prev) => prev + emoji.native);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setAudioChunks([]);
      setAudioBlob(null);
      setAudioUrl(null);
      recorder.ondataavailable = (event) => {
        setAudioChunks((prev) => [...prev, event.data]);
      };
      recorder.onstop = () => {
        const newAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(newAudioBlob);
        const url = URL.createObjectURL(newAudioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setIsRecording(true);
      setFileUploadError(null);
    } catch (err) {
      setFileUploadError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleSendAudio = async () => {
    if (!audioBlob) return;
    if (!BACKEND_URL) {
      setFileUploadError("Backend URL is not configured. Cannot send audio.");
      return;
    }
    setIsUploadingFile(true);
    setFileUploadError(null);
    const formData = new FormData();
    formData.append("file", audioBlob, `audio_message_${Date.now()}.webm`);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // Added Authorization header
        },
        credentials: 'include', // Added to support credentials with CORS
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      const result = await response.json();
      // It seems like sendMessage is meant to send the text message,
      // but here it's called after successful audio upload.
      // If the intent is to send the uploaded file URL/info, sendMessage might need to be updated
      // to accept arguments or a context that includes file details.
      // For now, assuming sendMessage handles sending the message based on the current state.
      sendMessage();
      setAudioBlob(null);
      setAudioUrl(null);
      setAudioChunks([]);
      setMessageInput(""); // Clear text input after sending audio
    } catch (error) {
      setFileUploadError("Failed to send audio message.");
    } finally {
      setIsUploadingFile(false);
      setAudioBlob(null);
      setAudioUrl(null);
      setAudioChunks([]);
      if (mediaRecorder) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const cancelAudioRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioChunks([]);
    setIsRecording(false);
    setFileUploadError(null);
  };

  const renderReplyContent = (msg: Message) => {
    return (
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-300">
          Replying to {msg.sender}
        </p>
        {msg.text && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
            {msg.text}
          </p>
        )}
        {msg.fileUrl && msg.fileType && (
          <div className="mt-1">
            {msg.fileType === "image" ? (
              <Image
                src={msg.fileUrl}
                alt={msg.fileName || "Shared Image"}
                width={80}
                height={80}
                className="max-w-[80px] h-auto rounded-lg shadow-sm"
                priority
              />
            ) : msg.fileType === "video" ? (
              <video
                controls
                src={msg.fileUrl}
                className="max-w-[80px] h-auto rounded-lg shadow-sm"
              />
            ) : msg.fileType === "audio" ? (
              <audio controls src={msg.fileUrl} className="w-[80px]" />
            ) : (
              <p className="text-xs italic text-gray-400">
                File: {msg.fileName}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`p-4 bg-gray-900 border-t border-gray-800 ${className}`}
    >
      {typingMessage && (
        <div className="text-gray-400 text-xs italic animate-pulse mb-3">
          {typingMessage}
        </div>
      )}
      {(fileUploadError || (audioUrl && !isRecording)) && (
        <div className="text-red-400 text-xs mb-3">
          {fileUploadError}
        </div>
      )}
      {replyingTo && (
        <div className="relative p-3 bg-gray-800/50 border-l-4 border-blue-700 mb-3 flex items-center rounded-lg">
          {renderReplyContent(replyingTo)}
          <button
            onClick={() => setReplyingTo(null)}
            className="ml-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 text-xs cursor-pointer"
            title="Cancel reply"
          >
            X
          </button>
        </div>
      )}
      {(filePreview || audioUrl) && (
        <div className="relative p-3 bg-gray-800/50 border border-gray-700 mb-3 rounded-lg">
          {filePreview ? (
            filePreview.startsWith("blob:http") ? (
              selectedFile?.type.startsWith("image/") ? (
                <Image
                  src={filePreview}
                  alt="Preview"
                  width={240}
                  height={240}
                  className="max-w-sm h-auto max-h-48 rounded-lg object-cover shadow-sm"
                  priority
                />
              ) : selectedFile?.type.startsWith("video/") ? (
                <video
                  controls
                  src={filePreview}
                  className="max-w-sm h-auto rounded-lg shadow-sm"
                />
              ) : (
                <div className="flex items-center text-gray-300 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V7.414L10.586 4H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  File selected: {selectedFile?.name}
                </div>
              )
            ) : (
              <div className="flex items-center text-gray-300 text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V7.414L10.586 4H6z"
                    clipRule="evenodd"
                  />
                </svg>
                File selected: {selectedFile?.name}
              </div>
            )
          ) : audioUrl ? (
            <div className="flex items-center space-x-2">
              <audio controls src={audioUrl} ref={audioRef} className="w-full max-w-xs"></audio>
            </div>
          ) : null}

          <button
            onClick={() => {
              setSelectedFile(null);
              setFilePreview(null);
              setFileUploadError(null);
              setAudioBlob(null);
              setAudioUrl(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 text-xs cursor-pointer"
            title="Remove file"
          >
            X
          </button>
        </div>
      )}
      <div className="flex items-center space-x-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors cursor-pointer"
          title="Attach File"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        </button>

        <div className="relative" ref={emojiPickerRef}>
          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors cursor-pointer"
            title="Choose Emoji"
          >
            <FaceSmileIcon className="h-5 w-5 text-gray-200" />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 left-0 z-50">
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="dark"
                perLine={7}
                previewPosition="none"
                emojiSize={24}
                emojiButtonSize={32}
              />
            </div>
          )}
        </div>

        <input
          type="text"
          value={messageInput}
          onChange={handleMessageInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (messageInput.trim() || audioBlob) {
                if (audioBlob) {
                  handleSendAudio();
                } else {
                  sendMessage();
                }
              }
            }
          }}
          placeholder={
            isRecording
              ? "Recording audio..."
              : isUploadingFile
              ? "Uploading file..."
              : "Type your message..."
          }
          className="flex-1 p-3 rounded-lg border border-gray-800 bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          disabled={isUploadingFile || isRecording}
        />

        {!messageInput.trim() && !selectedFile && !audioUrl ? (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-lg text-sm font-medium flex items-center transition-colors cursor-pointer ${
              isRecording
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-gray-800 hover:bg-gray-700 text-gray-200"
            }`}
            title={isRecording ? "Stop Recording" : "Record Audio"}
            disabled={isUploadingFile}
          >
            {isRecording ? (
              <StopCircleIcon className="h-5 w-5" />
            ) : (
              <MicrophoneIcon className="h-5 w-5" />
            )}
          </button>
        ) : (
          <button
            onClick={audioBlob ? handleSendAudio : sendMessage}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors cursor-pointer ${
              (!messageInput.trim() && !selectedFile && !audioBlob)
                ? "bg-blue-800 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
            disabled={(!messageInput.trim() && !selectedFile && !audioBlob) || isUploadingFile || isRecording}
          >
            <PaperAirplaneIcon className="h-4 w-4 mr-1" />
            Send
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageInput;