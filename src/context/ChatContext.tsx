// ** React Imports
import { createContext, useContext, useState, ReactNode } from 'react'

// ** Types
import { ChatStoreType, SendMsgParamsType, ContactType, ChatsArrType, ProfileUserType } from 'src/types/apps/chatTypes'

interface ChatContextType {
  chat: ChatStoreType
  sendMsg: (params: SendMsgParamsType) => void
  selectChat: (id: number) => void
  fetchUserProfile: () => void
  fetchChatsContacts: () => void
  removeSelectedChat: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

type Props = {
  children: ReactNode
}

const ChatProvider = ({ children }: Props) => {
  const [chat, setChat] = useState<ChatStoreType>({
    chats: null,
    contacts: null,
    userProfile: null,
    selectedChat: null
  })

  const sendMsg = (params: SendMsgParamsType) => {
    // Mock implementation - replace with actual API call
    console.log('Sending message:', params.message)
  }

  const selectChat = (id: number) => {
    const selectedContact = chat.contacts?.find(contact => contact.id === id)
    const selectedChatObj = chat.chats?.find(chatItem => chatItem.id === id)

    if (selectedContact && selectedChatObj) {
      setChat(prev => ({
        ...prev,
        selectedChat: { chat: selectedChatObj, contact: selectedContact }
      }))
    }
  }

  const fetchUserProfile = async () => {
    try {
      // Mock API call - replace with actual API
      const mockProfile: ProfileUserType = {
        id: 1,
        fullName: 'John Doe',
        role: 'admin',
        about: 'Vue.js, React & Node.js developer',
        avatar: '/images/avatars/1.png',
        status: 'online',
        settings: {
          isNotificationsOn: true,
          isTwoStepAuthVerificationEnabled: false
        }
      }

      setChat(prev => ({ ...prev, userProfile: mockProfile }))
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    }
  }

  const fetchChatsContacts = async () => {
    try {
      // Mock API call - replace with actual API
      const mockContacts: ContactType[] = [
        {
          id: 1,
          fullName: 'Alice Freeman',
          role: 'Frontend Developer',
          about: 'Cake pie jelly beans',
          avatar: '/images/avatars/1.png',
          status: 'online'
        },
        {
          id: 2,
          fullName: 'Bob Smith',
          role: 'UI/UX Designer',
          about: 'Donut chocolate bar',
          avatar: '/images/avatars/2.png',
          status: 'away'
        }
      ]

      const mockChats: ChatsArrType[] = mockContacts.map(contact => ({
        id: contact.id,
        userId: contact.id,
        chat: [
          {
            message: contact.status === 'online' ? 'Hey! How are you?' : 'See you tomorrow!',
            senderId: contact.id,
            time: contact.status === 'online' ? '10:30 AM' : 'Yesterday',
            feedback: {
              isSent: true,
              isSeen: false,
              isDelivered: true
            }
          }
        ],
        unseenMsgs: 0,
        lastMessage: {
          message: contact.status === 'online' ? 'Hey! How are you?' : 'See you tomorrow!',
          senderId: contact.id,
          time: contact.status === 'online' ? '10:30 AM' : 'Yesterday',
          feedback: {
            isSent: true,
            isSeen: false,
            isDelivered: true
          }
        }
      }))

      setChat(prev => ({ ...prev, chats: mockChats, contacts: mockContacts }))
    } catch (error) {
      console.error('Failed to fetch chats and contacts:', error)
    }
  }

  const removeSelectedChat = () => {
    setChat(prev => ({ ...prev, selectedChat: null }))
  }

  return (
    <ChatContext.Provider
      value={{
        chat,
        sendMsg,
        selectChat,
        fetchUserProfile,
        fetchChatsContacts,
        removeSelectedChat
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }

  return context
}

export { ChatProvider, ChatContext }
