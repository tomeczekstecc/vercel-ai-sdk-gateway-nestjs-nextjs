'use client'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useMemo, useRef, useState } from 'react'

export default function Home() {
    const [selectedModel, setSelectedModel] = useState(
        'google/gemini-2.5-flash-lite'
    )

    const selectedModelRef = useRef(selectedModel)
    selectedModelRef.current = selectedModel

    const { messages, sendMessage, status } = useChat({
        transport: useMemo(
            () =>
                new DefaultChatTransport({
                    // api: '/api/chat', // rewrited to proxy in next.cinfig.js
                    api: `${process.env.NEXT_PUBLIC_API_URL}/chat`,
                    body: {
                        model: selectedModelRef.current,
                    },
                }),
            []
        ),
    })

    const [input, setInput] = useState('')

    return (
        <div className='flex flex-col h-screen max-w-3xl mx-auto p-4'>
            <div className='mb-4'>
                <label
                    htmlFor='model-input'
                    className='block text-sm font-medium text-gray-400 mb-2'
                >
                    Model
                    <input
                        id='model-input'
                        type='text'
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className='w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white'
                    />
                </label>
            </div>

            <div className='flex-1 overflow-y-auto mb-4 space-y-4'>
                {messages.length === 0 && (
                    <div className='text-center text-gray-400 mt-8'>
                        Rozpocznij rozmowę
                    </div>
                )}
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-100'}`}
                        >
                            <div className='text-xs font-semibold mb-1 opacity-70'>
                                {message.role === 'user' ? 'Ty' : 'Asystent'}
                            </div>
                            <div className='space-y-3'>
                                {message.parts.map((part, index) => {
                                    if (part.type === 'text') {
                                        return (
                                            <div
                                                key={index}
                                                className='whitespace-pre-wrap'
                                            >
                                                {part.text}
                                            </div>
                                        )
                                    }
                                    return null
                                })}
                            </div>
                        </div>
                    </div>
                ))}
                {status !== 'ready' && (
                    <div className='flex justify-start'>
                        <div className='bg-gray-800 text-gray-100 rounded-lg px-4 py-2'>
                            <div className='flex items-center space-x-2'>
                                <div
                                    className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                                    style={{ animationDelay: '0ms' }}
                                ></div>
                                <div
                                    className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                                    style={{ animationDelay: '150ms' }}
                                ></div>
                                <div
                                    className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                                    style={{ animationDelay: '300ms' }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    if (input.trim()) {
                        sendMessage({
                            text: input,
                        })
                        setInput('')
                    }
                }}
                className='flex gap-2 mx-1'
            >
                <input
                    type='text'
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder='Twoja wiadomość...'
                    className='flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray=500'
                />
                <button
                    type='submit'
                    disabled={status !== 'ready' || !input.trim()}
                    className='px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                >
                    Wyślij
                </button>
            </form>
        </div>
    )
}
