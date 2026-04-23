"use client";

import { FormEvent, useState } from "react";
import { UploadCloud, Trash2, Star, Plus } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { api } from "@/src/lib/api/client";

export type ProductImagePayload = {
  url: string;
  es_principal: boolean;
  orden: number;
};

export type ProductPayload = {
  nombre: string;
  descripcion: string;
  precio_base: number;
  sku: string | null;
  esquema_opciones: Record<string, unknown>;
  activo: boolean;
  imagenes: ProductImagePayload[];
  imagen_principal_url: string | null;
};

export type ProductInitialValues = {
  nombre: string;
  descripcion: string;
  precio_base: string;
  sku: string;
  esquema_opciones: Record<string, unknown>;
  activo: boolean;
  imagenes: Array<{ url: string; es_principal: boolean; orden: number }>;
};

type ProductFormProps = {
  initialValues?: ProductInitialValues;
  submitLabel: string;
  onSubmit: (payload: ProductPayload) => Promise<void>;
  isSubmitting?: boolean;
  errorMessage?: string;
};

type ImageItem = {
  id: string;
  file?: File;
  url?: string;
  es_principal: boolean;
};

export type OptionItem = { label: string; extra: number };
export type VariantItem = { key: string; options: OptionItem[] };

export function ProductForm({
  initialValues,
  submitLabel,
  onSubmit,
  isSubmitting = false,
  errorMessage,
}: ProductFormProps) {
  const [nombre, setNombre] = useState(initialValues?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(initialValues?.descripcion ?? "");
  const [precioBase, setPrecioBase] = useState(initialValues?.precio_base ?? "0");
  const [sku, setSku] = useState(initialValues?.sku ?? "");
  const [activo, setActivo] = useState(initialValues?.activo ?? true);

  const [schemaVariants, setSchemaVariants] = useState<VariantItem[]>(() => {
    const initial = initialValues?.esquema_opciones || {};
    const variants: VariantItem[] = [];
    for (const [key, optionsList] of Object.entries(initial)) {
      if (Array.isArray(optionsList)) {
        variants.push({
          key,
          options: optionsList.map((opt: any) => ({
            label: opt.label || "",
            extra: Number(opt.extra) || 0,
          })),
        });
      }
    }
    return variants;
  });
  const [images, setImages] = useState<ImageItem[]>(
    initialValues?.imagenes?.sort((a, b) => a.orden - b.orden).map((img, idx) => ({
      id: `existing-${idx}`,
      url: img.url,
      es_principal: img.es_principal,
    })) || []
  );
  
  const [localError, setLocalError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const combinedError = errorMessage || localError;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file, idx) => ({
        id: `new-${Date.now()}-${idx}`,
        file,
        es_principal: images.length === 0 && idx === 0, // Primera imagen es principal si no hay ninguna
      }));
      setImages((prev) => [...prev, ...newFiles]);
    }
  };

  const setPrincipalImage = (id: string) => {
    setImages(images.map(img => ({
      ...img,
      es_principal: img.id === id
    })));
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      // Si eliminamos la imagen principal, asignar la primera disponible como principal
      if (updated.length > 0 && !updated.some(img => img.es_principal)) {
        updated[0].es_principal = true;
      }
      return updated;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError("");

    let parsedSchema: Record<string, unknown> = {};

    try {
      for (const variant of schemaVariants) {
        if (variant.key.trim()) {
          parsedSchema[variant.key.trim()] = variant.options
            .filter((opt) => opt.label.trim() !== "")
            .map((opt) => ({
              label: opt.label.trim(),
              extra: Number(opt.extra) || 0,
            }));
        }
      }
    } catch {
      setLocalError("Error procesando el esquema de opciones.");
      return;
    }

    const parsedPrice = Number(precioBase);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setLocalError("El precio base debe ser un numero valido mayor o igual a 0.");
      return;
    }

    setIsUploading(true);

    try {
      const uploadedImages = [];

      for (const img of images) {
        if (img.url) {
           uploadedImages.push({ url: img.url, es_principal: img.es_principal });
        } else if (img.file) {
           // 1. Obtener la firma segura desde nuestro backend
           const sigRes = await api.get("/api/admin/cloudinary-signature");
           const { timestamp, signature, api_key, cloud_name, folder } = sigRes.data;
           
           // 2. Armar el FormData para Cloudinary
           const formData = new FormData();
           formData.append("file", img.file);
           formData.append("api_key", api_key);
           formData.append("timestamp", timestamp.toString());
           formData.append("signature", signature);
           if (folder) formData.append("folder", folder);

           // 3. Subir directamente a la API de Cloudinary
           const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
             method: "POST",
             body: formData,
           });

           if (!uploadRes.ok) {
             throw new Error("Error subiendo la imagen a Cloudinary");
           }

           const data = await uploadRes.json();
           uploadedImages.push({ url: data.secure_url, es_principal: img.es_principal });
        }
      }

      // 4. Construir el payload final de imágenes
      const finalImages = uploadedImages.map((img, index) => ({
        url: img.url,
        es_principal: img.es_principal,
        orden: index,
      }));

      const imagenPrincipal = finalImages.find((image) => image.es_principal)?.url ?? null;

      await onSubmit({
        nombre,
        descripcion,
        precio_base: parsedPrice,
        sku: sku.trim() ? sku.trim() : null,
        esquema_opciones: parsedSchema,
        activo,
        imagenes: finalImages,
        imagen_principal_url: imagenPrincipal,
      });

    } catch (error: any) {
      setLocalError(error?.message || "Ocurrió un error al procesar las imágenes");
    } finally {
      setIsUploading(false);
    }
  };

  const isWorking = isSubmitting || isUploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[1.55rem] border border-foreground/10 bg-surface-light p-5 shadow-[0_8px_22px_rgba(24,22,17,0.05)] sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="space-y-2 sm:col-span-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Nombre</span>
          <input
            type="text"
            required
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            className="h-11 w-full rounded-xl border border-foreground/15 bg-white/85 px-3 text-sm outline-none transition focus:border-primary"
            placeholder="Caja Premium Negra"
          />
        </label>

        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Precio base</span>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={precioBase}
            onChange={(event) => setPrecioBase(event.target.value)}
            className="h-11 w-full rounded-xl border border-foreground/15 bg-white/85 px-3 text-sm outline-none transition focus:border-primary"
          />
        </label>

        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">SKU</span>
          <input
            type="text"
            value={sku}
            onChange={(event) => setSku(event.target.value)}
            className="h-11 w-full rounded-xl border border-foreground/15 bg-white/85 px-3 text-sm outline-none transition focus:border-primary"
            placeholder="SKU-001"
          />
        </label>

        <label className="space-y-2 sm:col-span-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Descripcion</span>
          <textarea
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            className="min-h-24 w-full rounded-xl border border-foreground/15 bg-white/85 px-3 py-2 text-sm outline-none transition focus:border-primary"
            placeholder="Detalles del producto"
          />
        </label>

        <div className="space-y-4 sm:col-span-2 mt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Opciones del Producto</span>
              <p className="text-[11px] font-medium text-amber-600">⚠️ Importante: Agrega los nombres de las variantes siempre con la primera letra en mayúscula (ej: Color, Tamaño).</p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => setSchemaVariants([...schemaVariants, { key: "", options: [] }])}
              className="h-8 text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar Variante
            </Button>
          </div>

          {schemaVariants.length === 0 ? (
            <div className="text-sm text-muted-foreground border border-dashed border-foreground/15 rounded-xl p-6 text-center bg-white/50">
              No hay variantes configuradas. Haz click en "Agregar Variante" para empezar.
            </div>
          ) : (
            <div className="space-y-6">
              {schemaVariants.map((variant, vIdx) => (
                <div key={vIdx} className="p-4 border border-foreground/10 rounded-xl bg-surface-alt/50 space-y-4">
                  {/* Fila de la Variante */}
                  <div className="flex items-end gap-3">
                    <label className="flex-1 space-y-1.5">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">Nombre de Variante (ej: color)</span>
                      <input
                        type="text"
                        value={variant.key}
                        onChange={(e) => {
                          const newVariants = [...schemaVariants];
                          newVariants[vIdx].key = e.target.value;
                          setSchemaVariants(newVariants);
                        }}
                        className="h-9 w-full rounded-lg border border-foreground/15 bg-white px-3 text-sm outline-none transition focus:border-primary"
                        placeholder="Ej: manijas"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setSchemaVariants(schemaVariants.filter((_, i) => i !== vIdx))}
                      className="h-9 px-3 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200"
                      title="Eliminar variante"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Opciones de la Variante */}
                  <div className="pl-4 border-l-2 border-foreground/10 space-y-3">
                    {variant.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <label className="flex-1">
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => {
                              const newVariants = [...schemaVariants];
                              newVariants[vIdx].options[oIdx].label = e.target.value;
                              setSchemaVariants(newVariants);
                            }}
                            className="h-8 w-full rounded-md border border-foreground/15 bg-white px-2.5 text-xs outline-none transition focus:border-primary"
                            placeholder="Valor (ej: Cordón)"
                          />
                        </label>
                        <label className="w-24 shrink-0">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={opt.extra === 0 && opt.label === "" ? "" : opt.extra}
                              onChange={(e) => {
                                const newVariants = [...schemaVariants];
                                newVariants[vIdx].options[oIdx].extra = parseFloat(e.target.value) || 0;
                                setSchemaVariants(newVariants);
                              }}
                              className="h-8 w-full rounded-md border border-foreground/15 bg-white pl-6 pr-2.5 text-xs outline-none transition focus:border-primary"
                              placeholder="Extra"
                            />
                          </div>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newVariants = [...schemaVariants];
                            newVariants[vIdx].options = newVariants[vIdx].options.filter((_, i) => i !== oIdx);
                            setSchemaVariants(newVariants);
                          }}
                          className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar opción"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => {
                        const newVariants = [...schemaVariants];
                        newVariants[vIdx].options.push({ label: "", extra: 0 });
                        setSchemaVariants(newVariants);
                      }}
                      className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 mt-2 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Agregar Opción
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Carga de Imágenes */}
        <div className="space-y-4 sm:col-span-2 mt-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Imágenes del Producto</span>
          
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-foreground/15 rounded-xl cursor-pointer bg-white/85 hover:bg-surface-alt transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Click para seleccionar</span> o arrastra y suelta</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, WEBP (Se subirán directamente a Cloudinary)</p>
              </div>
              <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} />
            </label>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
              {images.map((img) => (
                <div key={img.id} className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all ${img.es_principal ? 'border-primary' : 'border-outline-variant/50'}`}>
                  {img.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.url} alt="Vista previa" className="object-cover w-full h-full" />
                  ) : img.file ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={URL.createObjectURL(img.file)} alt="Vista previa nueva" className="object-cover w-full h-full" />
                  ) : null}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <button 
                      type="button" 
                      onClick={() => removeImage(img.id)}
                      className="self-end p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-md transition-colors"
                      title="Eliminar imagen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {!img.es_principal && (
                      <button 
                        type="button"
                        onClick={() => setPrincipalImage(img.id)}
                        className="w-full py-1.5 bg-white/90 hover:bg-white text-xs font-semibold text-foreground rounded-md transition-colors flex items-center justify-center gap-1"
                      >
                        <Star className="w-3 h-3" /> Principal
                      </button>
                    )}
                  </div>
                  
                  {img.es_principal && (
                    <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 pointer-events-none z-10">
                      <Star className="w-3 h-3 fill-current" /> Principal
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="mt-8 flex items-center gap-2 text-sm text-foreground sm:col-span-2">
          <input
            type="checkbox"
            checked={activo}
            onChange={(event) => setActivo(event.target.checked)}
            className="size-4 rounded border-foreground/20"
          />
          Producto activo
        </label>
      </div>

      {combinedError ? <p className="text-sm text-red-700 font-medium bg-red-50 p-3 rounded-lg border border-red-100">{combinedError}</p> : null}

      <div className="flex justify-end pt-4 border-t border-outline-variant/20">
        <Button type="submit" size="lg" disabled={isWorking} className="min-w-[150px]">
          {isUploading ? "Subiendo imágenes..." : isSubmitting ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
