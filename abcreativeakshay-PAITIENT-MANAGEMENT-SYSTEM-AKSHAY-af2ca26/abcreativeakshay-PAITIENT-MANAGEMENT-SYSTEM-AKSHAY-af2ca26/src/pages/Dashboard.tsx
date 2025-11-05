import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, FileText, Stethoscope } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: patientsCount } = useQuery({
    queryKey: ['patients-count'],
    queryFn: async () => {
      const { count } = await supabase.from('patients').select('*', { count: 'exact', head: true });
      return count || 0;
    }
  });

  const { data: doctorsCount } = useQuery({
    queryKey: ['doctors-count'],
    queryFn: async () => {
      const { count } = await supabase.from('doctors').select('*', { count: 'exact', head: true });
      return count || 0;
    }
  });

  const { data: appointmentsCount } = useQuery({
    queryKey: ['appointments-count'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('appointment_date', today)
        .lt('appointment_date', `${today}T23:59:59`);
      return count || 0;
    }
  });

  const { data: recordsCount } = useQuery({
    queryKey: ['records-count'],
    queryFn: async () => {
      const { count } = await supabase.from('medical_records').select('*', { count: 'exact', head: true });
      return count || 0;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Patient Management System</h1>
          <p className="text-muted-foreground mt-2">Manage patients, doctors, appointments, and medical records</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patientsCount}</div>
              <p className="text-xs text-muted-foreground">Registered patients</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
              <Stethoscope className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{doctorsCount}</div>
              <p className="text-xs text-muted-foreground">Active doctors</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointmentsCount}</div>
              <p className="text-xs text-muted-foreground">Scheduled today</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recordsCount}</div>
              <p className="text-xs text-muted-foreground">Total records</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/patients')}>
                Register New Patient
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/appointments')}>
                Schedule Appointment
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/medical-records')}>
                Add Medical Record
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/patients')}>
                View All Patients
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system updates</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
