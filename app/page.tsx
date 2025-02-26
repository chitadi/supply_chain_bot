"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Plus, SendIcon, PaperclipIcon } from "lucide-react"
import Image from "next/image"
import React from "react"

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [chats, setChats] = useState([{ id: "1", title: "Supply Chain Expert" }])
  const [currentChatId, setCurrentChatId] = useState("1")

  // Set welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Welcome to your Supply Chain Management Assistant! I'm here to help you optimize your supply chain operations, manage inventory, improve logistics, and tackle any supply chain challenges. What can I assist you with today?"
        }
      ])
    }
  }, [])

  const handleNewChat = () => {
    const newChat = { id: Date.now().toString(), title: "New Chat" }
    setChats([...chats, newChat])
    setCurrentChatId(newChat.id)
    // Clear messages and set new welcome message
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Welcome to your Supply Chain Management Assistant! I'm here to help you optimize your supply chain operations, manage inventory, improve logistics, and tackle any supply chain challenges. What can I assist you with today?"
      }
    ])
    setInput("") // Clear input field
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      // Call API with all messages
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].filter(m => m.id !== "welcome")
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch response')
      }

      const data = await response.json()
      
      // Add assistant message to chat
      setMessages(prev => [
        ...prev, 
        {
          id: Date.now().toString(),
          role: "assistant",
          content: data.content
        }
      ])
    } catch (error) {
      console.error('Error:', error)
      // Add error message
      setMessages(prev => [
        ...prev, 
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, there was an error processing your request. Please try again."
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Here you would typically upload the file and get a URL or ID
      // For this example, we'll just add the file name to the input
      setInput(`${input} [File: ${file.name}]`)
    }
  }

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-gray-100 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Image
            src="https://onusworks.com/wp-content/uploads/2023/10/onusworks-logo.png"
            alt="OnusWorks Logo"
            width={150}
            height={40}
            className="mx-auto"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setCurrentChatId(chat.id)}
              className="w-full p-3 text-left hover:bg-gray-200 flex items-center"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              <span className="truncate">{chat.title}</span>
            </button>
          ))}
        </div>
        <button
          onClick={handleNewChat}
          className="p-4 bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Chat
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-2xl font-bold text-center text-gray-800">Supply Chain Expert</h1>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {messages.map((m) => (
            <div key={m.id} className={`mb-4 ${m.role === "user" ? "text-right" : "text-left"}`}>
              <div
                className={`inline-block rounded-lg p-4 max-w-[80%] ${
                  m.role === "user" 
                    ? "bg-blue-600 text-white" 
                    : "bg-white text-gray-800 border border-gray-200 shadow-sm"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <label htmlFor="file-upload" className="cursor-pointer">
              <PaperclipIcon className="h-6 w-6 text-gray-400 hover:text-blue-500" />
            </label>
            <input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
            <input
              className="flex-1 rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 p-3 text-white hover:bg-blue-700"
            >
              <SendIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
