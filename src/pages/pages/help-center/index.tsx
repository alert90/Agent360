// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import CardContent, { CardContentProps } from '@mui/material/CardContent'

// ** Third Party Imports
import axios from 'axios'

// ** Types
import { HelpCenterCategoriesType, HelpCenterArticlesOverviewType } from 'src/@fake-db/types'

// ** Demo Imports
import HelpCenterLandingHeader from 'src/views/pages/help-center/landing/HelpCenterLandingHeader'
import HelpCenterLandingFooter from 'src/views/pages/help-center/landing/HelpCenterLandingFooter'
import HelpCenterLandingKnowledgeBase from 'src/views/pages/help-center/landing/HelpCenterLandingKnowledgeBase'
import HelpCenterLandingArticlesOverview from 'src/views/pages/help-center/landing/HelpCenterLandingArticlesOverview'

type ApiDataType = {
  categories: HelpCenterCategoriesType[]
  keepLearning: HelpCenterArticlesOverviewType[]
  popularArticles: HelpCenterArticlesOverviewType[]
  allArticles: any[]
}

const StyledCardContent = styled(CardContent)<CardContentProps>(({ theme }) => ({
  paddingTop: `${theme.spacing(20)} !important`,
  paddingBottom: `${theme.spacing(20)} !important`,
  [theme.breakpoints.up('sm')]: {
    paddingLeft: `${theme.spacing(20)} !important`,
    paddingRight: `${theme.spacing(20)} !important`
  }
}))

const HelpCenter = () => {
  const [apiData, setApiData] = useState<ApiDataType | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/pages/help-center/landing')
        setApiData(response.data)
      } catch (error) {
        console.error('Error fetching help center data:', error)
        setApiData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <Card>
        <StyledCardContent
          sx={{
            textAlign: 'center',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography variant='h5'>Loading...</Typography>
        </StyledCardContent>
      </Card>
    )
  }

  return (
    <Card>
      {apiData !== null ? (
        <>
          <HelpCenterLandingHeader data={apiData.categories} allArticles={apiData.allArticles} />
          <StyledCardContent>
            <Typography sx={{ mb: 6, fontWeight: 500, textAlign: 'center', fontSize: '1.625rem', lineHeight: 1.385 }}>
              Popular Articles
            </Typography>
            <HelpCenterLandingArticlesOverview articles={apiData.popularArticles} />
          </StyledCardContent>
          <StyledCardContent sx={{ backgroundColor: 'action.hover' }}>
            <Typography sx={{ mb: 6, fontWeight: 500, textAlign: 'center', fontSize: '1.625rem', lineHeight: 1.385 }}>
              Knowledge Base
            </Typography>
            <HelpCenterLandingKnowledgeBase categories={apiData.categories} />
          </StyledCardContent>
          <StyledCardContent>
            <Typography sx={{ mb: 6, fontWeight: 500, textAlign: 'center', fontSize: '1.625rem', lineHeight: 1.385 }}>
              Keep Learning
            </Typography>
            <HelpCenterLandingArticlesOverview articles={apiData.keepLearning} />
          </StyledCardContent>
          <StyledCardContent sx={{ textAlign: 'center', backgroundColor: 'action.hover' }}>
            <HelpCenterLandingFooter />
          </StyledCardContent>
        </>
      ) : (
        <StyledCardContent
          sx={{
            textAlign: 'center',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography variant='h5'>No data available</Typography>
        </StyledCardContent>
      )}
    </Card>
  )
}

export default HelpCenter
