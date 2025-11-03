import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const classSchema = z.object({
  nom: z.string().trim().min(1, "Le nom de la classe est requis").max(100, "Le nom doit faire moins de 100 caractères"),
  niveau: z.string().trim().min(1, "Le niveau est requis").max(50, "Le niveau doit faire moins de 50 caractères"),
  filiere: z.string().trim().max(50, "La filière doit faire moins de 50 caractères").optional(),
  effectif_max: z.number().int().min(1, "L'effectif doit être au moins 1").max(100, "L'effectif maximum est 100").default(40),
});

type ClassFormValues = z.infer<typeof classSchema>;

interface ClassFormProps {
  onSubmit: (data: ClassFormValues) => void;
  initialData?: Partial<ClassFormValues>;
  isLoading?: boolean;
}

const NIVEAUX = [
  "6ème",
  "5ème",
  "4ème",
  "3ème",
  "2nde",
  "1ère",
  "Terminale",
];

const FILIERES = [
  "Général",
  "S (Scientifique)",
  "L (Littéraire)",
  "STEG (Sciences et Technologies)",
  "Autre",
];

export const ClassForm = ({ onSubmit, initialData, isLoading }: ClassFormProps) => {
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      nom: initialData?.nom || "",
      niveau: initialData?.niveau || "",
      filiere: initialData?.filiere || "",
      effectif_max: initialData?.effectif_max || 40,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la classe</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 6ème A, Terminale S1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="niveau"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Niveau</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le niveau" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {NIVEAUX.map((niveau) => (
                    <SelectItem key={niveau} value={niveau}>
                      {niveau}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="filiere"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Filière (optionnel)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une filière" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FILIERES.map((filiere) => (
                    <SelectItem key={filiere} value={filiere}>
                      {filiere}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="effectif_max"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Effectif maximum</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="40"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 40)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
