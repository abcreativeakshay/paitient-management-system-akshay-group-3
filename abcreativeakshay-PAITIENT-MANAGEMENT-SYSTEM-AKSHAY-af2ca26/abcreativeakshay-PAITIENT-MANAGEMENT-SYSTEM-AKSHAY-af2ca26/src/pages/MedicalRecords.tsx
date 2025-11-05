import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MedicalRecords = () => {
  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [patientId, setPatientId] = useState("");
  const [recordDate, setRecordDate] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: records, isLoading, error } = useQuery({
    queryKey: ['medical-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          *,
          patients(first_name, last_name)
        `)
        .order('record_date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('patients').select('*');
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!patientId || !recordDate || !diagnosis || !treatment) {
        throw new Error("Please fill in all required fields");
      }
      
      const recordData: any = {
        patient_id: patientId,
        diagnosis: diagnosis.trim(),
        treatment: treatment.trim(),
        notes: notes.trim() || null,
      };
      
      // Add date field - use record_date if available, otherwise visit_date
      if (recordDate) {
        recordData.record_date = recordDate;
        recordData.visit_date = recordDate; // Support both field names
      }
      
      const { error } = await supabase.from('medical_records').insert([recordData]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records'] });
      queryClient.invalidateQueries({ queryKey: ['records-count'] });
      resetForm();
      setOpen(false);
      toast({ title: "Medical record created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create medical record", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingRecord || !patientId || !recordDate || !diagnosis || !treatment) {
        throw new Error("Please fill in all required fields");
      }
      
      const updateData: any = {
        patient_id: patientId,
        diagnosis: diagnosis.trim(),
        treatment: treatment.trim(),
        notes: notes.trim() || null,
      };
      
      // Add date field - use record_date if available, otherwise visit_date
      if (recordDate) {
        updateData.record_date = recordDate;
        updateData.visit_date = recordDate; // Support both field names
      }
      
      const { error } = await supabase
        .from('medical_records')
        .update(updateData)
        .eq('id', editingRecord.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records'] });
      resetForm();
      setOpen(false);
      toast({ title: "Medical record updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update medical record", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('medical_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records'] });
      queryClient.invalidateQueries({ queryKey: ['records-count'] });
      toast({ title: "Medical record deleted successfully" });
    }
  });

  const resetForm = () => {
    setEditingRecord(null);
    setPatientId("");
    setRecordDate("");
    setDiagnosis("");
    setTreatment("");
    setNotes("");
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setPatientId(record.patient_id);
    setRecordDate(record.record_date);
    setDiagnosis(record.diagnosis);
    setTreatment(record.treatment);
    setNotes(record.notes || "");
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Medical Records</h1>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Medical Record</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingRecord ? 'Edit Medical Record' : 'Add New Medical Record'}</DialogTitle>
                <DialogDescription>
                  {editingRecord ? 'Update the medical record details below.' : 'Create a new medical record for a patient.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="patient_id">Patient *</Label>
                  <Select value={patientId} onValueChange={setPatientId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients?.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.first_name} {patient.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="record_date">Record Date *</Label>
                  <Input 
                    id="record_date" 
                    type="date" 
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="diagnosis">Diagnosis *</Label>
                  <Textarea 
                    id="diagnosis" 
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    required 
                    maxLength={2000}
                  />
                </div>
                <div>
                  <Label htmlFor="treatment">Treatment *</Label>
                  <Textarea 
                    id="treatment" 
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                    required 
                    maxLength={2000}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea 
                    id="notes" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={2000}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending || !patientId}
                >
                  {editingRecord 
                    ? (updateMutation.isPending ? "Updating..." : "Update Record")
                    : (createMutation.isPending ? "Creating..." : "Create Record")
                  }
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Medical Records</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : error ? (
              <div className="text-destructive">
                <p className="font-semibold">Error loading medical records:</p>
                <p className="text-sm">{error.message}</p>
              </div>
            ) : !records?.length ? (
              <p className="text-muted-foreground">No medical records found. Add your first record above.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Treatment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records?.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {record.patients.first_name} {record.patients.last_name}
                      </TableCell>
                      <TableCell>{new Date(record.record_date).toLocaleDateString()}</TableCell>
                      <TableCell>{record.diagnosis}</TableCell>
                      <TableCell>{record.treatment}</TableCell>
                      <TableCell className="space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEdit(record)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => deleteMutation.mutate(record.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MedicalRecords;
