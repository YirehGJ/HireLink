import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart } from 'lucide-react';

export function AdminDashboard() {
  return (
    <Tabs defaultValue="audit">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="audit">Registro de Auditoría</TabsTrigger>
        <TabsTrigger value="equity">Panel de Equidad</TabsTrigger>
      </TabsList>
      <TabsContent value="audit" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Últimas Acciones en la Plataforma</CardTitle>
            <CardDescription>Un registro de los eventos importantes que ocurren en HireLink.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Acción</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Detalles</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell className="font-medium">recruiter@example.com</TableCell>
                        <TableCell>Creó vacante</TableCell>
                        <TableCell>15/07/2024 10:30</TableCell>
                        <TableCell>ID: job-3</TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell className="font-medium">candidate@example.com</TableCell>
                        <TableCell>Subió CV</TableCell>
                        <TableCell>15/07/2024 09:15</TableCell>
                        <TableCell>resume_final.pdf</TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell className="font-medium">admin@example.com</TableCell>
                        <TableCell>Cambió rol</TableCell>
                        <TableCell>14/07/2024 18:00</TableCell>
                        <TableCell>user: user-x a recruiter</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="equity" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Equidad (Placeholder)</CardTitle>
            <CardDescription>Visualización de datos para asegurar un proceso de contratación justo.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-96 bg-card/50 rounded-lg border-2 border-dashed">
            <div className="text-center text-muted-foreground">
                <BarChart className="h-16 w-16 mx-auto" />
                <p className="mt-4">Gráficos de equidad y sesgo se mostrarán aquí.</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
