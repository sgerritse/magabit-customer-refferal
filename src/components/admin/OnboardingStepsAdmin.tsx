import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, GripVertical, X } from "lucide-react";
import { useOnboardingSteps, OnboardingStep } from "@/hooks/useOnboardingSteps";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableItemProps {
  step: OnboardingStep;
  onEdit: (step: OnboardingStep) => void;
  onDelete: (id: string) => void;
}

function SortableItem({ step, onEdit, onDelete }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: step.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-card rounded-lg border"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <h4 className="font-medium">{step.title}</h4>
        <p className="text-sm text-muted-foreground">{step.description}</p>
        <p className="text-xs text-muted-foreground mt-1">Icon: {step.icon}</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onEdit(step)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(step.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export const OnboardingStepsAdmin = () => {
  const { steps, createStep, updateStep, deleteStep, reorderSteps } = useOnboardingSteps();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<OnboardingStep | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "CheckCircle",
    enable_video_url: false,
    video_url: "",
    cta_buttons: [] as Array<{
      text: string;
      url: string;
      url_type: "internal" | "external" | "mark_complete";
      open_in_new_window: boolean;
      color?: string;
    }>,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.id === active.id);
      const newIndex = steps.findIndex((s) => s.id === over.id);

      const newOrder = arrayMove(steps, oldIndex, newIndex);
      const updates = newOrder.map((step, index) => ({
        id: step.id,
        step_order: index + 1,
      }));

      reorderSteps.mutate(updates);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingStep) {
      updateStep.mutate({
        id: editingStep.id,
        ...formData,
      });
    } else {
      createStep.mutate({
        ...formData,
        step_order: steps.length + 1,
        is_active: true,
      });
    }

    setIsDialogOpen(false);
    setEditingStep(null);
    setFormData({
      title: "",
      description: "",
      icon: "CheckCircle",
      enable_video_url: false,
      video_url: "",
      cta_buttons: [],
    });
  };

  const handleEdit = (step: OnboardingStep) => {
    setEditingStep(step);
    setFormData({
      title: step.title,
      description: step.description,
      icon: step.icon,
      enable_video_url: step.enable_video_url || false,
      video_url: step.video_url || "",
      cta_buttons: (step.cta_buttons || []).map(btn => ({
        ...btn,
        open_in_new_window: btn.open_in_new_window ?? false
      })),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this step?")) {
      deleteStep.mutate(id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingStep(null);
      setFormData({
        title: "",
        description: "",
        icon: "CheckCircle",
        enable_video_url: false,
        video_url: "",
        cta_buttons: [],
      });
    }
  };

  const addCtaButton = () => {
    setFormData({
      ...formData,
      cta_buttons: [
        ...formData.cta_buttons,
        { text: "", url: "", url_type: "internal" as "internal" | "external" | "mark_complete", open_in_new_window: false, color: "#4ca153" },
      ],
    });
  };

  const removeCtaButton = (index: number) => {
    setFormData({
      ...formData,
      cta_buttons: formData.cta_buttons.filter((_, i) => i !== index),
    });
  };

  const updateCtaButton = (
    index: number,
    field: "text" | "url" | "url_type" | "open_in_new_window" | "color",
    value: string | boolean
  ) => {
    const updated = [...formData.cta_buttons];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, cta_buttons: updated });
  };

  const internalPages = [
    { value: "/profile", label: "Profile" },
    { value: "/dashboard", label: "Dashboard" },
    { value: "/community", label: "Community" },
    { value: "/progress", label: "Progress" },
    { value: "/settings", label: "Settings" },
    { value: "/billing", label: "Billing" },
    { value: "/podcasts", label: "Podcasts" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Onboarding Steps</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-card-foreground">
                {editingStep ? "Edit Step" : "Add New Step"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pb-4">
              <div>
                <Label htmlFor="title" className="text-gray-900">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-900">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="icon" className="text-gray-900">
                  Icon (Lucide icon name)
                </Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  placeholder="CheckCircle"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">
                  Examples: CheckCircle, User, Target, Users, Award
                </p>
              </div>

              {/* Video URL Section */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable_video_url"
                    checked={formData.enable_video_url}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enable_video_url: checked as boolean })
                    }
                  />
                  <Label htmlFor="enable_video_url" className="text-gray-900 font-medium">
                    Enable Video URL
                  </Label>
                </div>

                {formData.enable_video_url && (
                  <div className="ml-6 space-y-2">
                    <div>
                      <Label htmlFor="video_url" className="text-gray-900">YouTube Video URL</Label>
                      <Input
                        id="video_url"
                        type="url"
                        value={formData.video_url}
                        onChange={(e) =>
                          setFormData({ ...formData, video_url: e.target.value })
                        }
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Enter the full YouTube video URL
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* CTA Buttons - Independent Section */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-900 font-medium">CTA Buttons</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCtaButton}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Button
                  </Button>
                </div>

                {formData.cta_buttons.map((button, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-900 text-sm">Button {index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCtaButton(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div>
                      <Label htmlFor={`cta-text-${index}`} className="text-gray-700 text-xs">
                        Button Text
                      </Label>
                      <Input
                        id={`cta-text-${index}`}
                        value={button.text}
                        onChange={(e) =>
                          updateCtaButton(index, "text", e.target.value)
                        }
                        placeholder="e.g., Get Started"
                      />
                    </div>

                          <div>
                            <Label htmlFor={`cta-url-type-${index}`} className="text-gray-700 text-xs">
                              Button Type
                            </Label>
                            <Select
                              value={button.url_type}
                              onValueChange={(value: "internal" | "external" | "mark_complete") =>
                                updateCtaButton(index, "url_type", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="internal">Internal Page</SelectItem>
                                <SelectItem value="external">External URL</SelectItem>
                                <SelectItem value="mark_complete">Mark Complete</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {button.url_type === "internal" ? (
                            <div>
                              <Label htmlFor={`cta-url-${index}`} className="text-gray-700 text-xs">
                                Select Page
                              </Label>
                              <Select
                                value={button.url}
                                onValueChange={(value) =>
                                  updateCtaButton(index, "url", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a page" />
                                </SelectTrigger>
                                <SelectContent>
                                  {internalPages.map((page) => (
                                    <SelectItem key={page.value} value={page.value}>
                                      {page.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : button.url_type === "external" ? (
                            <div>
                              <Label htmlFor={`cta-url-${index}`} className="text-gray-700 text-xs">
                                External URL
                              </Label>
                              <Input
                                id={`cta-url-${index}`}
                                type="url"
                                value={button.url}
                                onChange={(e) =>
                                  updateCtaButton(index, "url", e.target.value)
                                }
                                placeholder="https://example.com"
                              />
                            </div>
                           ) : (
                            <div className="p-2 bg-blue-50 rounded text-xs text-blue-700">
                              This button will mark the onboarding step as complete and close the popup.
                            </div>
                          )}

                          {/* Open in New Window Checkbox - Only for internal and external URLs */}
                          {(button.url_type === "internal" || button.url_type === "external") && (
                            <div className="flex items-center space-x-2 pt-2">
                              <Checkbox
                                id={`open-new-window-${index}`}
                                checked={button.open_in_new_window}
                                onCheckedChange={(checked) =>
                                  updateCtaButton(index, "open_in_new_window", checked as boolean)
                                }
                              />
                              <Label htmlFor={`open-new-window-${index}`} className="text-gray-700 text-xs font-normal cursor-pointer">
                                Open in new window
                              </Label>
                            </div>
                          )}

                          {/* Custom Button Color */}
                          <div className="space-y-2 pt-2 border-t pt-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`enable-color-${index}`}
                                  checked={!!button.color}
                                  onCheckedChange={(checked) => {
                                    if (!checked) {
                                      updateCtaButton(index, "color", "");
                                    } else {
                                      updateCtaButton(index, "color", "#4ca153");
                                    }
                                  }}
                                />
                                <Label htmlFor={`enable-color-${index}`} className="text-gray-700 text-xs font-normal cursor-pointer">
                                  Enable custom color
                                </Label>
                              </div>
                              {button.color && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateCtaButton(index, "color", "#4ca153")}
                                  className="h-7 text-xs"
                                >
                                  Reset
                                </Button>
                              )}
                            </div>
                            
                            {button.color && (
                              <>
                                <div className="flex gap-2">
                                  <Input
                                    id={`button-color-${index}`}
                                    type="text"
                                    value={button.color}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      // Allow hex codes with or without #
                                      if (value === '' || /^#?[0-9A-Fa-f]{0,6}$/.test(value)) {
                                        const formatted = value.startsWith('#') ? value : `#${value}`;
                                        updateCtaButton(index, "color", formatted);
                                      }
                                    }}
                                    placeholder="#4ca153"
                                    maxLength={7}
                                    className="flex-1 font-mono"
                                  />
                                  <Input
                                    type="color"
                                    value={button.color || '#4ca153'}
                                    onChange={(e) =>
                                      updateCtaButton(index, "color", e.target.value)
                                    }
                                    className="w-16 h-10 cursor-pointer p-1"
                                  />
                                </div>
                                <p className="text-xs text-gray-500">
                                  Enter a hex color code or use the color picker
                                </p>
                              </>
                            )}
                          </div>
                  </div>
                ))}

                {formData.cta_buttons.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    No CTA buttons added. Click "Add Button" to create one.
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full">
                {editingStep ? "Update Step" : "Create Step"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-foreground mb-4">
            Drag and drop to reorder steps
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {steps.map((step) => (
                <SortableItem
                  key={step.id}
                  step={step}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
          {steps.length === 0 && (
            <p className="text-center text-foreground py-8">
              No onboarding steps yet. Click "Add Step" to create one.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};