// ** React Imports
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

// ** Third Party Imports
import axios from 'axios'

// ** Types
import { PricingDataType } from 'src/@core/components/plan-details/types'

// ** Demo Components Imports
import AccountSettings from 'src/views/pages/account-settings/AccountSettings'

const AccountSettingsTab = () => {
  const router = useRouter()
  const { tab } = router.query
  const [apiPricingPlanData, setApiPricingPlanData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/pages/pricing')
        setApiPricingPlanData(response.data.pricingPlans || [])
      } catch (error) {
        console.error('Error fetching pricing data:', error)
        setApiPricingPlanData([])
      } finally {
        setLoading(false)
      }
    }

    if (tab) {
      fetchPricingData()
    }
  }, [tab])

  if (loading) {
    return <div>Loading...</div>
  }

  return <AccountSettings tab={tab as string} apiPricingPlanData={apiPricingPlanData} />
}

export default AccountSettingsTab
