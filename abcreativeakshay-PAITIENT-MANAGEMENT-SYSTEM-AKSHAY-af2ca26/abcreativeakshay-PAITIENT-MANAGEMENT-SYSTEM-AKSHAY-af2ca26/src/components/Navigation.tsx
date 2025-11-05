import { Link, useLocation } from "react-router-dom";
import { Home, Users, Stethoscope, Calendar, FileText, Pill } from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const location = useLocation();

  const links = [
    { to: "/", label: "Dashboard", icon: Home },
    { to: "/patients", label: "Patients", icon: Users },
    { to: "/doctors", label: "Doctors", icon: Stethoscope },
    { to: "/appointments", label: "Appointments", icon: Calendar },
    { to: "/prescriptions", label: "Prescriptions", icon: Pill },
    { to: "/medical-records", label: "Medical Records", icon: FileText },
  ];

  return (
    <nav className="bg-card border-b">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h2 className="text-xl font-bold text-primary">PMS</h2>
            <div className="flex space-x-4">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
