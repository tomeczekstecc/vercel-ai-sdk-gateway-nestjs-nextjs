'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Chat {
    id: string
    updatedAt: string
    snippet: string
}

export function ChatSidebar() {
    const [chats, setChats] = useState<Chat[]>([])
    const router = useRouter()
    const pathname = usePathname()

    const fetchChats = async () => {
        const response = await fetch('/api/chats')
        setChats(await response.json())
    }

    useEffect(() => {
        fetchChats()
    }, [])

    const createNewChat = () => {
        const newChatId = crypto.randomUUID()
        router.push(`/chat/${newChatId}`)
    }

    const getCurrentChatId = () => {
        if (pathname.startsWith('/chat/')) {
            return pathname.split('/')[2]
        }
        return null
    }

    const currentChatId = getCurrentChatId()

    return (
        <div className='w-64 bg-gray-900 broder-r border-gray-700 flex flex-col h-screen'>
            <div className='p-4 border-b border-gray-700'>
                <button
                    onClick={createNewChat}
                    className='w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
                >
                    + Nowy czat
                </button>
            </div>

            <div className='flex-1 overflow-y-auto p-2'>
                {chats.length === 0 ? (
                    <div className='text-center text-gray-500 py-8 text-sm'>
                        Brak rozmów
                    </div>
                ) : (
                    <div className='space-y-1'>
                        {chats.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => router.push(`/chat/${chat.id}`)}
                                className={`w-full px-3 py-2 rounded-lg transition-colors text-left ${
                                    currentChatId === chat.id
                                        ? 'bg-gray-800 text-white'
                                        : 'hover:bg-gray-800 text-gray-300'
                                }`}
                            >
                                <div className='text-sm truncate mb-1'>
                                    {chat.snippet}
                                </div>
                                <div className='text-xs text-gray-500'>
                                    {new Date(
                                        chat.updatedAt
                                    ).toLocaleDateString()}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
