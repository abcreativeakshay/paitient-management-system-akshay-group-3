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
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Prescriptions = () => {
  const [open, setOpen] = useState(false);
  const [appointmentId, setAppointmentId] = useState("");
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [instructions, setInstructions] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: prescriptions, isLoading, error } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          appointments(
            appointment_date,
            patients(first_name, last_name),
            doctors(first_name, last_name)
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: appointments } = useQuery({
    queryKey: ['completed-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients(first_name, last_name),
          doctors(first_name, last_name)
        `)
        .eq('status', 'completed')
        .order('appointment_date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!appointmentId || !medication || !dosage || !instructions) {
        throw new Error("Please fill in all required fields");
      }
      
      const { error } = await supabase.from('prescriptions').insert([{
        appointment_id: appointmentId,
        medication: medication.trim(),
        dosage: dosage.trim(),
        instructions: instructions.trim(),
      }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      setOpen(false);
      setAppointmentId("");
      setMedication("");
      setDosage("");
      setInstructions("");
      toast({ title: "Prescription created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create prescription", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('prescriptions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      toast({ title: "Prescription deleted successfully" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Prescriptions</h1>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setAppointmentId("");
              setMedication("");
              setDosage("");
              setInstructions("");
            }
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Prescription</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Prescription</DialogTitle>
                <DialogDescription>
                  Create a prescription for a completed appointment.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="appointment_id">Appointment *</Label>
                  <Select value={appointmentId} onValueChange={setAppointmentId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select appointment" />
                    </SelectTrigger>
                    <SelectContent>
                      {appointments?.map((appointment: any) => (
                        <SelectItem key={appointment.id} value={appointment.id}>
                          {appointment.patients.first_name} {appointment.patients.last_name} - 
                          Dr. {appointment.doctors.first_name} {appointment.doctors.last_name} - 
                          {new Date(appointment.appointment_date).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="medication">Medication *</Label>
                  <Input 
                    id="medication" 
                    value={medication}
                    onChange={(e) => setMedication(e.target.value)}
                    required 
                    maxLength={255}
                  />
                </div>
                <div>
                  <Label htmlFor="dosage">Dosage *</Label>
                  <Input 
                    id="dosage" 
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    required 
                    placeholder="e.g., 500mg twice daily"
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="instructions">Instructions *</Label>
                  <Textarea 
                    id="instructions" 
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    required 
                    maxLength={1000}
                  />
                </div>
                <Button type="submit" disabled={createMutation.isPending || !appointmentId}>
                  {createMutation.isPending ? "Creating..." : "Add Prescription"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : error ? (
              <div className="text-destructive">
                <p className="font-semibold">Error loading prescriptions:</p>
                <p className="text-sm">{error.message}</p>
              </div>
            ) : !prescriptions?.length ? (
              <p className="text-muted-foreground">No prescriptions found. Add your first prescription above.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Medication</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Instructions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptions?.map((prescription: any) => (
                    <TableRow key={prescription.id}>
                      <TableCell>
                        {prescription.appointments.patients.first_name} {prescription.appointments.patients.last_name}
                      </TableCell>
                      <TableCell>
                        Dr. {prescription.appointments.doctors.first_name} {prescription.appointments.doctors.last_name}
                      </TableCell>
                      <TableCell>{prescription.medication}</TableCell>
                      <TableCell>{prescription.dosage}</TableCell>
                      <TableCell>{prescription.instructions}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => deleteMutation.mutate(prescription.id)}
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

export default Prescriptions;
