import { NextApiRequest, NextApiResponse } from 'next/types'

// Mock data for profile table
const mockData = [
  {
    id: 1,
    name: 'Q1 Commission Analysis',
    date: '2024-01-01',
    leader: 'John Doe',
    avatarGroup: ['/images/avatars/1.png', '/images/avatars/2.png', '/images/avatars/3.png'],
    status: 78,
    projectName: 'Q1 Commission Analysis',
    projectType: 'Commission Analysis',
    progress: 78,
    totalTasks: '122/240',
    hours: '18:42',
    team: ['John Doe', 'Jane Smith', 'Mike Johnson'],
    priority: 'high',
    budget: 50000,
    spent: 39000
  },
  {
    id: 2,
    name: 'Agent Performance Dashboard',
    date: '2024-02-01',
    leader: 'Sarah Williams',
    avatarGroup: ['/images/avatars/4.png', '/images/avatars/5.png'],
    status: 92,
    projectName: 'Agent Performance Dashboard',
    projectType: 'KPI Management',
    progress: 92,
    totalTasks: '45/48',
    hours: '20:42',
    team: ['Sarah Williams', 'Tom Brown'],
    priority: 'medium',
    budget: 25000,
    spent: 23000
  },
  {
    id: 3,
    name: 'Monthly Transaction Report',
    date: '2024-01-15',
    leader: 'Alex Davis',
    avatarGroup: ['/images/avatars/6.png', '/images/avatars/7.png', '/images/avatars/8.png', '/images/avatars/9.png'],
    status: 62,
    projectName: 'Monthly Transaction Report',
    projectType: 'Transaction Analysis',
    progress: 62,
    totalTasks: '290/320',
    hours: '120:87',
    team: ['Alex Davis', 'Emma Wilson', 'Chris Lee', 'Lisa Anderson'],
    priority: 'low',
    budget: 75000,
    spent: 46500
  },
  {
    id: 4,
    name: 'Regional Performance Heatmap',
    date: '2024-03-01',
    leader: 'David Martinez',
    avatarGroup: ['/images/avatars/10.png', '/images/avatars/11.png'],
    status: 45,
    projectName: 'Regional Performance Heatmap',
    projectType: 'Zone Management',
    progress: 45,
    totalTasks: '28/63',
    hours: '89:19',
    team: ['David Martinez', 'Jennifer Taylor'],
    priority: 'medium',
    budget: 35000,
    spent: 15750
  },
  {
    id: 5,
    name: 'Super Agent Commission Setup',
    date: '2024-02-15',
    leader: 'Robert Garcia',
    avatarGroup: ['/images/avatars/12.png', '/images/avatars/13.png', '/images/avatars/14.png'],
    status: 85,
    projectName: 'Super Agent Commission Setup',
    projectType: 'Commission Config',
    progress: 85,
    totalTasks: '120/140',
    hours: '230:10',
    team: ['Robert Garcia', 'Michelle Rodriguez', 'Kevin White'],
    priority: 'high',
    budget: 60000,
    spent: 51000
  },
  {
    id: 6,
    name: 'Customer Analytics Platform',
    date: '2024-04-01',
    leader: 'Amanda Thompson',
    avatarGroup: ['/images/avatars/15.png', '/images/avatars/1.png'],
    status: 30,
    projectName: 'Customer Analytics Platform',
    projectType: 'Analytics',
    progress: 30,
    totalTasks: '45/150',
    hours: '67:45',
    team: ['Amanda Thompson', 'Brian Jackson'],
    priority: 'medium',
    budget: 80000,
    spent: 24000
  },
  {
    id: 7,
    name: 'Franchise Network Optimization',
    date: '2024-01-20',
    leader: 'Carlos Hernandez',
    avatarGroup: ['/images/avatars/2.png', '/images/avatars/3.png', '/images/avatars/4.png'],
    status: 55,
    projectName: 'Franchise Network Optimization',
    projectType: 'Network Analysis',
    progress: 55,
    totalTasks: '88/160',
    hours: '145:30',
    team: ['Carlos Hernandez', 'Diana King', 'Eric Wright'],
    priority: 'high',
    budget: 90000,
    spent: 49500
  }
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { q } = req.query

    // If there's a search query, filter the data
    let filteredData = mockData
    if (q && typeof q === 'string') {
      const query = q.toLowerCase()
      filteredData = mockData.filter(
        item =>
          item.projectName.toLowerCase().includes(query) ||
          item.projectType.toLowerCase().includes(query) ||
          item.status.toString().includes(query) ||
          item.priority.toLowerCase().includes(query) ||
          item.team.some(member => member.toLowerCase().includes(query))
      )
    }

    res.status(200).json(filteredData)
  } catch (error) {
    console.error('Error in profile-table API:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
