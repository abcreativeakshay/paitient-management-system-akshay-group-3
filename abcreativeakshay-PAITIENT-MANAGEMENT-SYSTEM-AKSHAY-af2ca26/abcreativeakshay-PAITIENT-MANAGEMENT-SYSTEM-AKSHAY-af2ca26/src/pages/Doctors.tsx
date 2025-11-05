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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Doctors = () => {
  const [open, setOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase.from('doctors').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const doctor = {
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        specialization: formData.get('specialization') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
      };
      const { error } = await supabase.from('doctors').insert([doctor]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['doctors-count'] });
      setOpen(false);
      toast({ title: "Doctor created successfully" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string, formData: FormData }) => {
      const doctor = {
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        specialization: formData.get('specialization') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
      };
      const { error } = await supabase.from('doctors').update(doctor).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setOpen(false);
      setEditingDoctor(null);
      toast({ title: "Doctor updated successfully" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('doctors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['doctors-count'] });
      toast({ title: "Doctor deleted successfully" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (editingDoctor) {
      updateMutation.mutate({ id: editingDoctor.id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Doctors</h1>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) setEditingDoctor(null);
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Doctor</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input id="first_name" name="first_name" required defaultValue={editingDoctor?.first_name} />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input id="last_name" name="last_name" required defaultValue={editingDoctor?.last_name} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input id="specialization" name="specialization" required defaultValue={editingDoctor?.specialization} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" required defaultValue={editingDoctor?.phone} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required defaultValue={editingDoctor?.email} />
                </div>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingDoctor ? 'Update' : 'Create'} Doctor
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Doctors</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors?.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell>{doctor.first_name} {doctor.last_name}</TableCell>
                      <TableCell>{doctor.specialization}</TableCell>
                      <TableCell>{doctor.phone}</TableCell>
                      <TableCell>{doctor.email}</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditingDoctor(doctor);
                          setOpen(true);
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(doctor.id)}>
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

export default Doctors;
