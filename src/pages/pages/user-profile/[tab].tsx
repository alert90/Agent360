// ** Next Import
import { GetServerSideProps, GetServerSidePropsContext } from 'next/types'

// ** Third Party Imports
import axios from 'axios'

// ** Demo Components Imports
import UserProfile from 'src/views/pages/user-profile/UserProfile'

// ** Types
import { UserProfileActiveTab } from 'src/@fake-db/types'

const UserProfileTab = ({ tab }: { tab: string }) => {
  return <UserProfile tab={tab} />
}

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
  const { tab } = context.params!

  try {
    // Get the token from cookies to verify authentication
    const token = context.req.cookies.accessToken

    if (!token) {
      return {
        redirect: {
          destination: '/login',
          permanent: false
        }
      }
    }

    // Just verify token exists, data fetching will be done client-side
    return {
      props: {
        tab: tab as string
      }
    }
  } catch (error) {
    console.error('Profile page error:', error)

    // Redirect to login on authentication error
    return {
      redirect: {
        destination: '/login',
        permanent: false
      }
    }
  }
}

export default UserProfileTab
