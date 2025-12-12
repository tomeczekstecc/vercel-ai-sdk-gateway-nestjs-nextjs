'use client'

import { ChatSidebar } from '../components/ChatSidebar'

export default function Home() {
    return (
        <div className='flex h-screen'>
            <ChatSidebar />
            <div className='flex-1 flex items-center justify-center bg-gray-950'>
                <div className='text-center'>
                    <h1 className='text-4xl font-bold text-white mb-4'>
                        Witaj w czacie
                    </h1>
                    <p className='text-gray-400 mb-6'>
                        Kontynuuj konwersację wybierając czat po lewej lub
                        zacznij nową rozmowę
                    </p>
                </div>
            </div>
        </div>
    )
}
