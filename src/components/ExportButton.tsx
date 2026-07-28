import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportButtonProps {
  onExportPDF: () => Promise<void>;
  onExportExcel: () => Promise<void>;
  label?: string;
  disabled?: boolean;
}

export function ExportButton({ 
  onExportPDF, 
  onExportExcel, 
  label = "Exporter",
  disabled = false 
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      setIsExporting(true);
      if (format === 'pdf') {
        await onExportPDF();
      } else {
        await onExportExcel();
      }
      toast({
        title: "Export réussi",
        description: `Le fichier ${format.toUpperCase()} a été téléchargé avec succès`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur d'export",
        description: error.message || "Une erreur est survenue lors de l'export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isExporting} className="gap-2">
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Export en cours...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              {label}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Exporter en PDF
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('excel')}
          disabled={isExporting}
          className="gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Exporter en Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


















