// ** Type import
import { HorizontalNavItemsType } from 'src/@core/layouts/types'

const navigation = (): HorizontalNavItemsType => {
  return [
    {
      icon: 'tabler:smart-home',
      title: 'Dashboards',
      children: [
        {
          icon: 'tabler:chart-pie-2',
          title: 'Admin',
          path: '/dashboard/admin'
        },
        {
          icon: 'tabler:device-analytics',
          title: 'Analyst',
          path: '/dashboard/analyst'
        },
        {
          icon: 'tabler:shopping-cart',
          title: 'Super Agent',
          path: '/dashboard/sa'
        },
        {
          icon: 'tabler:building-store',
          title: 'Franchise',
          path: '/dashboard/franchise'
        }
      ]
    },
    {
      icon: 'tabler:users',
      title: 'Agents',
      children: [
        {
          title: 'All Agents',
          icon: 'tabler:list',
          path: '/agents/list'
        },
        {
          title: 'Add Agent',
          icon: 'tabler:user-plus',
          path: '/agents/add'
        },
        {
          title: 'Agent Performance',
          icon: 'tabler:chart-line',
          path: '/agents/performance'
        }
      ]
    },
    {
      icon: 'tabler:transaction-dollar',
      title: 'Transactions',
      children: [
        {
          title: 'All Transactions',
          icon: 'tabler:list',
          path: '/transactions/list'
        },
        {
          title: 'Transaction History',
          icon: 'tabler:history',
          path: '/transactions/history'
        }
      ]
    },
    {
      icon: 'tabler:currency-dollar',
      title: 'Commissions',
      children: [
        {
          title: 'Past Commissions',
          icon: 'tabler:history',
          path: '/commission/overview'
        },
        {
          title: 'Commission Reports',
          icon: 'tabler:file-text',
          path: '/commission/report'
        },
        {
          title: 'Commission Settings',
          icon: 'tabler:settings',
          path: '/commission/config'
        }
      ]
    },
    {
      icon: 'tabler:chart-bar',
      title: 'Reports & Analytics',
      children: [
        {
          title: 'Performance Reports',
          icon: 'tabler:chart-line',
          path: '/report/performance'
        },
        {
          title: 'Financial Reports',
          icon: 'tabler:currency-dollar',
          path: '/report/financial'
        },
        {
          title: 'Agent Reports',
          icon: 'tabler:user',
          path: '/report/agent'
        }
      ]
    },
    {
      icon: 'tabler:settings',
      title: 'Administration',
      children: [
        {
          title: 'Users',
          icon: 'tabler:user',
          path: '/apps/user/list'
        },
        {
          title: 'Roles',
          icon: 'tabler:shield',
          path: '/apps/roles'
        },
        {
          title: 'Permissions',
          icon: 'tabler:key',
          path: '/apps/permissions'
        },
        {
          title: 'System Settings',
          icon: 'tabler:settings',
          path: '/admin/settings/general'
        }
      ]
    }
  ]
}

export default navigation
