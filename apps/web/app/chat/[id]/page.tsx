'use client'

import { useParams } from 'next/navigation'
import { ChatSidebar } from '../../../components/ChatSidebar'
import ChatInterface from '../../../components/ChatInterface'

export default function ChatPage() {
    const params = useParams()
    const id = params.id as string

    return (
        <div className='flex h-screen'>
            <ChatSidebar />
            <ChatInterface chatId={id} />
        </div>
    )
}
