// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Demo Components
import AboutOverivew from 'src/views/pages/user-profile/profile/AboutOverivew'
import ProjectsTable from 'src/views/pages/user-profile/profile/ProjectsTable'
import ActivityTimeline from 'src/views/pages/user-profile/profile/ActivityTimeline'
import ConnectionsTeams from 'src/views/pages/user-profile/profile/ConnectionsTeams'
import EditProfile from 'src/views/pages/user-profile/profile/EditProfile'

// ** Types
import { ProfileTabData, ProfileTeamsType, ProfileConnectionsType } from 'src/types/profile'

const ProfileTab = ({ data }: { data: ProfileTabData }) => {
  // ** States
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState(data)

  const handleSaveProfile = (updatedUser: any) => {
    // Update the profile data with the new information
    const updatedData = {
      ...profileData,
      about: profileData.about.map((item: any) => {
        switch (item.property.toLowerCase()) {
          case 'full name':
            return { ...item, value: updatedUser.full_name }
          case 'location':
            return { ...item, value: updatedUser.location || 'Not specified' }
          case 'zone':
            return { ...item, value: updatedUser.zone || 'Not specified' }
          default:
            return item
        }
      }),
      contacts: profileData.contacts.map((item: any) => {
        switch (item.property.toLowerCase()) {
          case 'username':
            return { ...item, value: updatedUser.username }
          case 'email':
            return { ...item, value: updatedUser.email }
          default:
            return item
        }
      })
    }

    setProfileData(updatedData)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  if (!profileData || !Object.values(profileData).length) {
    return null
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          {!isEditing && (
            <Button variant='contained' onClick={() => setIsEditing(true)} startIcon={<Icon icon='tabler:edit' />}>
              Edit Profile
            </Button>
          )}
        </Box>
      </Grid>

      {isEditing ? (
        <Grid item xs={12}>
          <EditProfile
            initialData={{
              about: profileData.about,
              contacts: profileData.contacts
            }}
            onSave={handleSaveProfile}
            onCancel={handleCancelEdit}
          />
        </Grid>
      ) : (
        <>
          <Grid item lg={4} md={5} xs={12}>
            <AboutOverivew
              about={profileData.about}
              contacts={profileData.contacts}
              teams={profileData.teams}
              overview={profileData.overview}
            />
          </Grid>
          <Grid item lg={8} md={7} xs={12}>
            <Grid container spacing={6}>
              <Grid item xs={12}>
                <ActivityTimeline />
              </Grid>
              <ConnectionsTeams connections={profileData.connections} teams={profileData.teams} />
              <Grid item xs={12}>
                <ProjectsTable />
              </Grid>
            </Grid>
          </Grid>
        </>
      )}
    </Grid>
  )
}

export default ProfileTab
