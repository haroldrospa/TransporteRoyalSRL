 import { Card, CardContent } from '@/components/ui/card';
 import { Package } from 'lucide-react';
 
 const FersuazNoDataCard = () => {
   return (
     <Card>
       <CardContent className="p-8">
         <div className="flex flex-col items-center justify-center text-center">
           <Package className="h-16 w-16 text-muted-foreground mb-4" />
           <h3 className="text-xl font-semibold mb-2">Sin datos disponibles</h3>
           <p className="text-muted-foreground">
             No hay conduces de Fersuaz registrados en este momento.
           </p>
         </div>
       </CardContent>
     </Card>
   );
 };
 
 export default FersuazNoDataCard;