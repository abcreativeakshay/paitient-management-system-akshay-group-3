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

const Patients = () => {
  const [open, setOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const patient = {
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        date_of_birth: formData.get('date_of_birth') as string,
        gender: formData.get('gender') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
        address: formData.get('address') as string,
      };
      const { error } = await supabase.from('patients').insert([patient]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients-count'] });
      setOpen(false);
      toast({ title: "Patient created successfully" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string, formData: FormData }) => {
      const patient = {
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        date_of_birth: formData.get('date_of_birth') as string,
        gender: formData.get('gender') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
        address: formData.get('address') as string,
      };
      const { error } = await supabase.from('patients').update(patient).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setOpen(false);
      setEditingPatient(null);
      toast({ title: "Patient updated successfully" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients-count'] });
      toast({ title: "Patient deleted successfully" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (editingPatient) {
      updateMutation.mutate({ id: editingPatient.id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Patients</h1>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) setEditingPatient(null);
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Patient</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingPatient ? 'Edit Patient' : 'Add New Patient'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input id="first_name" name="first_name" required defaultValue={editingPatient?.first_name} />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input id="last_name" name="last_name" required defaultValue={editingPatient?.last_name} />
                  </div>
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input id="date_of_birth" name="date_of_birth" type="date" required defaultValue={editingPatient?.date_of_birth} />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select name="gender" defaultValue={editingPatient?.gender || 'Male'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" required defaultValue={editingPatient?.phone} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required defaultValue={editingPatient?.email} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" name="address" required defaultValue={editingPatient?.address} />
                </div>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingPatient ? 'Update' : 'Create'} Patient
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Patients</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients?.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>{patient.first_name} {patient.last_name}</TableCell>
                      <TableCell>{patient.date_of_birth}</TableCell>
                      <TableCell>{patient.gender}</TableCell>
                      <TableCell>{patient.phone}</TableCell>
                      <TableCell>{patient.email}</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditingPatient(patient);
                          setOpen(true);
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(patient.id)}>
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

export default Patients;
