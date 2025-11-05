import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const Appointments = () => {
  const [open, setOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients(first_name, last_name),
          doctors(first_name, last_name, specialization)
        `)
        .order('appointment_date', { ascending: false });
      if (error) {
        console.error('Appointments query error:', error);
        throw error;
      }
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

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase.from('doctors').select('*');
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const dateTimeValue = formData.get('appointment_date') as string;
      const appointment: any = {
        patient_id: formData.get('patient_id') as string,
        doctor_id: formData.get('doctor_id') as string,
        appointment_date: dateTimeValue,
        status: formData.get('status') as string,
        notes: formData.get('notes') as string || null,
      };
      
      // If database has separate appointment_time column, add it
      if (dateTimeValue) {
        appointment.appointment_time = dateTimeValue.split('T')[1] || '00:00';
      }
      
      const { error } = await supabase.from('appointments').insert([appointment]);
      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-count'] });
      setOpen(false);
      toast({ title: "Appointment created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create appointment", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string, formData: FormData }) => {
      const dateTimeValue = formData.get('appointment_date') as string;
      const appointment: any = {
        patient_id: formData.get('patient_id') as string,
        doctor_id: formData.get('doctor_id') as string,
        appointment_date: dateTimeValue,
        status: formData.get('status') as string,
        notes: formData.get('notes') as string || null,
      };
      
      // If database has separate appointment_time column, add it
      if (dateTimeValue) {
        appointment.appointment_time = dateTimeValue.split('T')[1] || '00:00';
      }
      
      const { error } = await supabase.from('appointments').update(appointment).eq('id', id);
      if (error) {
        console.error('Update error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setOpen(false);
      setEditingAppointment(null);
      toast({ title: "Appointment updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update appointment", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-count'] });
      toast({ title: "Appointment deleted successfully" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (editingAppointment) {
      updateMutation.mutate({ id: editingAppointment.id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Appointments</h1>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) setEditingAppointment(null);
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Schedule Appointment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingAppointment ? 'Edit Appointment' : 'Schedule New Appointment'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="patient_id">Patient</Label>
                  <Select name="patient_id" defaultValue={editingAppointment?.patient_id}>
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
                  <Label htmlFor="doctor_id">Doctor</Label>
                  <Select name="doctor_id" defaultValue={editingAppointment?.doctor_id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors?.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="appointment_date">Appointment Date & Time</Label>
                  <Input 
                    id="appointment_date" 
                    name="appointment_date" 
                    type="datetime-local" 
                    required 
                    defaultValue={editingAppointment?.appointment_date?.slice(0, 16)} 
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={editingAppointment?.status || 'scheduled'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" defaultValue={editingAppointment?.notes} />
                </div>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingAppointment ? 'Update' : 'Schedule'} Appointment
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : error ? (
              <div className="text-destructive">
                <p className="font-semibold">Error loading appointments:</p>
                <p className="text-sm">{error.message}</p>
                <p className="text-xs mt-2">Make sure you've run the database schema in Supabase SQL Editor.</p>
              </div>
            ) : !appointments?.length ? (
              <p className="text-muted-foreground">No appointments found. Schedule your first appointment above.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments?.map((appointment: any) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        {appointment.patients.first_name} {appointment.patients.last_name}
                      </TableCell>
                      <TableCell>
                        Dr. {appointment.doctors.first_name} {appointment.doctors.last_name}
                        <br />
                        <span className="text-xs text-muted-foreground">{appointment.doctors.specialization}</span>
                      </TableCell>
                      <TableCell>{new Date(appointment.appointment_date).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditingAppointment(appointment);
                          setOpen(true);
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(appointment.id)}>
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

export default Appointments;
