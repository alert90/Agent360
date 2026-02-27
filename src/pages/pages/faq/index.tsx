// ** React Imports
import { Fragment, useEffect, useState, SyntheticEvent } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import axios from 'axios'

// ** Types
import { FaqType } from 'src/@fake-db/types'

// ** Demo Imports
import FAQS from 'src/views/pages/faq/Faqs'
import FaqHeader from 'src/views/pages/faq/FaqHeader'
import FaqFooter from 'src/views/pages/faq/FaqFooter'

const FAQ = () => {
  // ** States
  const [data, setData] = useState<{ faqData: FaqType } | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [activeTab, setActiveTab] = useState<string>('payment')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (searchTerm !== '') {
          const response = await axios.get('/api/pages/faqs', { params: { q: searchTerm } })

          // Check if there are any categories with questions
          const hasQuestions =
            response.data.faqData &&
            Object.values(response.data.faqData).some((category: any) => category.qandA && category.qandA.length > 0)

          if (hasQuestions) {
            setData(response.data)

            // @ts-ignore
            setActiveTab(Object.values(response.data.faqData)[0].id)
          } else {
            setData(null)
          }
        } else {
          const response = await axios.get('/api/pages/faqs')

          // Check if there are any categories with questions
          const hasQuestions =
            response.data.faqData &&
            Object.values(response.data.faqData).some((category: any) => category.qandA && category.qandA.length > 0)

          if (hasQuestions) {
            setData(response.data)

            // @ts-ignore
            setActiveTab(Object.values(response.data.faqData)[0].id)
          } else {
            setData(null)
          }
        }
      } catch (error) {
        console.error('Error fetching FAQ data:', error)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [searchTerm])

  const handleChange = (event: SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)
  }

  const renderNoResult = (
    <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', '& svg': { mr: 2 } }}>
      <Icon fontSize='1.5rem' icon='tabler:alert-circle' />
      <Typography variant='h5'>No Results Found!!</Typography>
    </Box>
  )

  const renderLoading = (
    <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Typography variant='h5'>Loading...</Typography>
    </Box>
  )

  if (loading) {
    return (
      <Fragment>
        <FaqHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        {renderLoading}
        <FaqFooter />
      </Fragment>
    )
  }

  return (
    <Fragment>
      <FaqHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      {data !== null ? <FAQS data={data} activeTab={activeTab} handleChange={handleChange} /> : renderNoResult}
      <FaqFooter />
    </Fragment>
  )
}

export default FAQ
