// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid
} from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import axios from 'axios'
import toast from 'react-hot-toast'

interface FAQCategory {
  id: number
  slug: string
  title: string
  icon: string
  subtitle: string
  orderIndex: number
  isActive: boolean
  questions: FAQQuestion[]
}

interface FAQQuestion {
  id: number
  slug: string
  question: string
  answer: string
  orderIndex: number
  isActive: boolean
}

const FAQManagement = () => {
  // ** States
  const [categories, setCategories] = useState<FAQCategory[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Dialog states
  const [categoryDialog, setCategoryDialog] = useState(false)
  const [questionDialog, setQuestionDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<FAQQuestion | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    slug: '',
    title: '',
    icon: 'tabler:help',
    subtitle: '',
    orderIndex: 0,
    isActive: true
  })

  const [questionForm, setQuestionForm] = useState({
    categoryId: 0,
    slug: '',
    question: '',
    answer: '',
    orderIndex: 0,
    isActive: true
  })

  // Fetch FAQ data on component mount
  useEffect(() => {
    fetchFAQData()
  }, [])

  const fetchFAQData = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/admin/faqs')
      setCategories(response.data.categories)
    } catch (error) {
      console.error('Error fetching FAQ data:', error)
      setAlert({ type: 'error', message: 'Failed to load FAQ data' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        // Update existing category
        await axios.put('/api/admin/faqs', {
          type: 'category',
          id: editingCategory.id,
          data: categoryForm
        })
        toast.success('Category updated successfully')
      } else {
        // Create new category
        await axios.post('/api/admin/faqs', {
          type: 'category',
          data: categoryForm
        })
        toast.success('Category created successfully')
      }

      setCategoryDialog(false)
      resetCategoryForm()
      fetchFAQData()
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Failed to save category')
    }
  }

  const handleSaveQuestion = async () => {
    try {
      if (editingQuestion) {
        // Update existing question
        await axios.put('/api/admin/faqs', {
          type: 'question',
          id: editingQuestion.id,
          data: questionForm
        })
        toast.success('Question updated successfully')
      } else {
        // Create new question
        await axios.post('/api/admin/faqs', {
          type: 'question',
          data: questionForm
        })
        toast.success('Question created successfully')
      }

      setQuestionDialog(false)
      resetQuestionForm()
      fetchFAQData()
    } catch (error) {
      console.error('Error saving question:', error)
      toast.error('Failed to save question')
    }
  }

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category and all its questions?')) {
      return
    }

    try {
      await axios.delete('/api/admin/faqs', {
        data: { type: 'category', id: categoryId }
      })
      toast.success('Category deleted successfully')
      fetchFAQData()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return
    }

    try {
      await axios.delete('/api/admin/faqs', {
        data: { type: 'question', id: questionId }
      })
      toast.success('Question deleted successfully')
      fetchFAQData()
    } catch (error) {
      console.error('Error deleting question:', error)
      toast.error('Failed to delete question')
    }
  }

  const resetCategoryForm = () => {
    setCategoryForm({
      slug: '',
      title: '',
      icon: 'tabler:help',
      subtitle: '',
      orderIndex: 0,
      isActive: true
    })
    setEditingCategory(null)
  }

  const resetQuestionForm = () => {
    setQuestionForm({
      categoryId: selectedCategoryId || 0,
      slug: '',
      question: '',
      answer: '',
      orderIndex: 0,
      isActive: true
    })
    setEditingQuestion(null)
    setSelectedCategoryId(null)
  }

  const openCategoryDialog = (category?: FAQCategory) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({
        slug: category.slug,
        title: category.title,
        icon: category.icon,
        subtitle: category.subtitle,
        orderIndex: category.orderIndex,
        isActive: category.isActive
      })
    } else {
      resetCategoryForm()
    }
    setCategoryDialog(true)
  }

  const openQuestionDialog = (categoryId: number, question?: FAQQuestion) => {
    setSelectedCategoryId(categoryId)
    if (question) {
      setEditingQuestion(question)
      setQuestionForm({
        categoryId: categoryId,
        slug: question.slug,
        question: question.question,
        answer: question.answer,
        orderIndex: question.orderIndex,
        isActive: question.isActive
      })
    } else {
      resetQuestionForm()
      setQuestionForm(prev => ({ ...prev, categoryId }))
    }
    setQuestionDialog(true)
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            Loading FAQ data...
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant='h5'>FAQ Management</Typography>
          <Button variant='contained' startIcon={<Icon icon='tabler:plus' />} onClick={() => openCategoryDialog()}>
            Add Category
          </Button>
        </Box>

        {alert && (
          <Alert severity={alert.type} sx={{ mb: 4 }} onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        {categories.length === 0 ? (
          <Typography>No FAQ categories found. Create your first category to get started.</Typography>
        ) : (
          <Box>
            {categories.map(category => (
              <Accordion key={category.id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<Icon icon='tabler:chevron-down' />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Icon icon={category.icon} style={{ marginRight: 8 }} />
                      <Typography variant='h6'>{category.title}</Typography>
                      <Chip
                        label={category.isActive ? 'Active' : 'Inactive'}
                        color={category.isActive ? 'success' : 'default'}
                        size='small'
                        sx={{ ml: 2 }}
                      />
                    </Box>
                    <Box>
                      <IconButton
                        size='small'
                        onClick={e => {
                          e.stopPropagation()
                          openQuestionDialog(category.id)
                        }}
                      >
                        <Icon icon='tabler:plus' />
                      </IconButton>
                      <IconButton
                        size='small'
                        onClick={e => {
                          e.stopPropagation()
                          openCategoryDialog(category)
                        }}
                      >
                        <Icon icon='tabler:edit' />
                      </IconButton>
                      <IconButton
                        size='small'
                        color='error'
                        onClick={e => {
                          e.stopPropagation()
                          handleDeleteCategory(category.id)
                        }}
                      >
                        <Icon icon='tabler:trash' />
                      </IconButton>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                    {category.subtitle}
                  </Typography>

                  {category.questions.length === 0 ? (
                    <Typography variant='body2' color='text.secondary'>
                      No questions in this category yet.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} variant='outlined'>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>Question</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell width={120}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {category.questions.map(question => (
                            <TableRow key={question.id}>
                              <TableCell>
                                <Typography variant='body2'>{question.question}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={question.isActive ? 'Active' : 'Inactive'}
                                  color={question.isActive ? 'success' : 'default'}
                                  size='small'
                                />
                              </TableCell>
                              <TableCell>
                                <IconButton size='small' onClick={() => openQuestionDialog(category.id, question)}>
                                  <Icon icon='tabler:edit' />
                                </IconButton>
                                <IconButton
                                  size='small'
                                  color='error'
                                  onClick={() => handleDeleteQuestion(question.id)}
                                >
                                  <Icon icon='tabler:trash' />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {/* Category Dialog */}
        <Dialog open={categoryDialog} onClose={() => setCategoryDialog(false)} maxWidth='sm' fullWidth>
          <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Slug'
                  value={categoryForm.slug}
                  onChange={e => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                  helperText='URL-friendly identifier'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Title'
                  value={categoryForm.title}
                  onChange={e => setCategoryForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Icon'
                  value={categoryForm.icon}
                  onChange={e => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
                  helperText='Tabler icon name (e.g., tabler:help)'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type='number'
                  label='Order'
                  value={categoryForm.orderIndex}
                  onChange={e => setCategoryForm(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Subtitle'
                  value={categoryForm.subtitle}
                  onChange={e => setCategoryForm(prev => ({ ...prev, subtitle: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={categoryForm.isActive}
                      onChange={e => setCategoryForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                  }
                  label='Active'
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCategoryDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveCategory} variant='contained'>
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Question Dialog */}
        <Dialog open={questionDialog} onClose={() => setQuestionDialog(false)} maxWidth='md' fullWidth>
          <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={questionForm.categoryId}
                    label='Category'
                    onChange={e =>
                      setQuestionForm(prev => ({ ...prev, categoryId: parseInt(e.target.value as string) }))
                    }
                  >
                    {categories.map(category => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Slug'
                  value={questionForm.slug}
                  onChange={e => setQuestionForm(prev => ({ ...prev, slug: e.target.value }))}
                  helperText='URL-friendly identifier'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type='number'
                  label='Order'
                  value={questionForm.orderIndex}
                  onChange={e => setQuestionForm(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Question'
                  value={questionForm.question}
                  onChange={e => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Answer'
                  value={questionForm.answer}
                  onChange={e => setQuestionForm(prev => ({ ...prev, answer: e.target.value }))}
                  multiline
                  rows={4}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={questionForm.isActive}
                      onChange={e => setQuestionForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                  }
                  label='Active'
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setQuestionDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveQuestion} variant='contained'>
              {editingQuestion ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default FAQManagement
