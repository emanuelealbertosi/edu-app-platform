import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  Grid, TextField, FormControl, InputLabel, Select, MenuItem, 
  Typography, Box, CircularProgress, Alert, SelectChangeEvent
} from '@mui/material';
import { PathTemplate, PathNodeTemplate } from '../../services/PathService';
import { QuizTemplate } from '../../services/QuizService';

interface AddQuizToPathDialogProps {
  open: boolean;
  onClose: () => void;
  selectedTemplate: PathTemplate | null;
  availableQuizzes: QuizTemplate[];
  loadingQuizzes: boolean;
  onAddQuiz: (templateId: string, quizId: string, nodeData: Partial<PathNodeTemplate>) => Promise<void>;
}

const AddQuizToPathDialog: React.FC<AddQuizToPathDialogProps> = ({
  open,
  onClose,
  selectedTemplate,
  availableQuizzes,
  loadingQuizzes,
  onAddQuiz
}) => {
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [quizNodeData, setQuizNodeData] = useState({
    title: '',
    description: '',
    points: 10,
    order: 1,
    estimated_time: 30
  });

  // Reset form when dialog opens or closes
  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setSelectedQuizId('');
      setQuizNodeData({
        title: '',
        description: '',
        points: 10,
        order: 1,
        estimated_time: 30
      });
    }
  }, [open]);

  // Handle quiz selection
  const handleSelectedQuizChange = (event: SelectChangeEvent<string>) => {
    const quizId = event.target.value;
    setSelectedQuizId(quizId);
    
    // Find the selected quiz and populate title and description
    const selectedQuiz = availableQuizzes.find(quiz => quiz.id === quizId);
    if (selectedQuiz) {
      setQuizNodeData(prev => ({
        ...prev,
        title: `Quiz: ${selectedQuiz.title}`,
        description: selectedQuiz.description || 'Completa questo quiz per procedere nel percorso'
      }));
    }
  };

  // Handle form input changes
  const handleQuizNodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setQuizNodeData(prev => ({
      ...prev,
      [name]: name === 'points' || name === 'order' || name === 'estimated_time' 
        ? parseInt(value, 10) || 0 
        : value
    }));
  };

  // Handle quiz addition to path
  const handleAddQuiz = async () => {
    if (!selectedTemplate || !selectedQuizId) return;
    
    // Verifica che l'ID del template esista
    if (!selectedTemplate.id) {
      console.error("Template ID is undefined");
      return;
    }
    
    try {
      await onAddQuiz(
        selectedTemplate.id,
        selectedQuizId,
        quizNodeData
      );
      
      onClose();
    } catch (error) {
      console.error("Error adding quiz to path:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        Aggiungi Quiz al Percorso: {selectedTemplate?.title}
      </DialogTitle>
      
      <DialogContent dividers>
        {loadingQuizzes ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : availableQuizzes.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Non ci sono quiz disponibili da aggiungere al percorso.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Per aggiungere quiz ai percorsi, è necessario prima creare alcuni quiz accedendo alla sezione
              "Gestione Quiz" nel pannello amministrativo. Una volta creati, torneranno disponibili qui.
            </Typography>
          </Alert>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="quiz-select-label">Seleziona Quiz</InputLabel>
                <Select
                  labelId="quiz-select-label"
                  id="quiz-select"
                  value={selectedQuizId}
                  label="Seleziona Quiz"
                  onChange={handleSelectedQuizChange}
                >
                  {availableQuizzes.map((quiz) => (
                    <MenuItem key={quiz.id} value={quiz.id}>
                      {quiz.title} - {quiz.subject} ({quiz.difficultyLevel})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {selectedQuizId && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Configura il nodo Quiz nel percorso
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Titolo del nodo"
                    name="title"
                    value={quizNodeData.title}
                    onChange={handleQuizNodeInputChange}
                    margin="normal"
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descrizione"
                    name="description"
                    value={quizNodeData.description}
                    onChange={handleQuizNodeInputChange}
                    margin="normal"
                    multiline
                    rows={2}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Punti"
                    name="points"
                    type="number"
                    value={quizNodeData.points}
                    onChange={handleQuizNodeInputChange}
                    margin="normal"
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Ordine nel percorso"
                    name="order"
                    type="number"
                    value={quizNodeData.order}
                    onChange={handleQuizNodeInputChange}
                    margin="normal"
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Tempo stimato (minuti)"
                    name="estimated_time"
                    type="number"
                    value={quizNodeData.estimated_time}
                    onChange={handleQuizNodeInputChange}
                    margin="normal"
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button 
          onClick={handleAddQuiz} 
          variant="contained" 
          color="primary" 
          disabled={!selectedQuizId || !quizNodeData.title}
        >
          Aggiungi Quiz
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddQuizToPathDialog;
