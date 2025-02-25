"use client"

import { useState } from "react"
import { MessageSquare, Plus } from "lucide-react"

export function Sidebar({ chats, onSelectChat, onNewChat }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="w-64 bg-gray-100 border-r border-gray-200 flex flex-col">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-9 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300"
      >
        {isOpen ? "<" : ">"}
      </button>
      <div className="flex h-full flex-col overflow-y-auto p-3">
        <button
          onClick={onNewChat}
          className="mb-2 flex items-center justify-center rounded-lg bg-blue-500 p-2 text-white hover:bg-blue-600"
        >
          <Plus size={20} />
          {isOpen && <span className="ml-2">New Chat</span>}
        </button>
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className="mb-2 flex items-center rounded-lg p-2 hover:bg-gray-200"
          >
            <MessageSquare size={20} />
            {isOpen && <span className="ml-2 overflow-hidden text-ellipsis whitespace-nowrap">{chat.title}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

