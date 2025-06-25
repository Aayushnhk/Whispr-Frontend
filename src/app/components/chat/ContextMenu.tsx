import React from "react";
import type { ContextMenu } from "@/types";
import {
  PencilSquareIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/solid";

interface ContextMenuProps {
  contextMenu: ContextMenu;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenu>>;
  messageId: string;
  handleEdit: () => void;
  handleDelete: () => void;
  handleReply: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  contextMenu,
  setContextMenu,
  messageId,
  handleEdit,
  handleDelete,
  handleReply,
}) => {
  if (!contextMenu.visible || contextMenu.messageId !== messageId) return null;

  return (
    <div
      id="context-menu"
      className="absolute z-10 bg-gray-900 rounded-md shadow-lg border border-gray-800 overflow-hidden whitespace-nowrap max-w-[200px]"
      style={{
        top: `${contextMenu.position.y}px`,
        left: `${contextMenu.position.x}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          handleEdit();
          setContextMenu({
            visible: false,
            messageId: null,
            position: { x: 0, y: 0 },
          });
        }}
        className="w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-800 flex items-center cursor-pointer"
      >
        <PencilSquareIcon className="w-4 h-4 mr-2" />
        Edit
      </button>
      <button
        onClick={() => {
          handleDelete();
          setContextMenu({
            visible: false,
            messageId: null,
            position: { x: 0, y: 0 },
          });
        }}
        className="w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-800 flex items-center cursor-pointer"
      >
        <TrashIcon className="w-4 h-4 mr-2" />
        Delete
      </button>
      <button
        onClick={() => {
          handleReply();
          setContextMenu({
            visible: false,
            messageId: null,
            position: { x: 0, y: 0 },
          });
        }}
        className="w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-800 flex items-center cursor-pointer"
      >
        <ArrowUturnLeftIcon className="w-4 h-4 mr-2" />
        Reply
      </button>
    </div>
  );
};

export default ContextMenu;
