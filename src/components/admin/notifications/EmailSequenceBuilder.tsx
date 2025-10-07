import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Save, Mail, Clock, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface SequenceStep {
  id?: string;
  template_id: string | null;
  step_order: number;
  delay_days: number;
  delay_hours: number;
  send_time: string;
}

interface Sequence {
  id?: string;
  sequence_name: string;
  description: string;
  trigger_event: string;
  is_active: boolean;
  steps: SequenceStep[];
}

export const EmailSequenceBuilder = () => {
  const queryClient = useQueryClient();
  const [selectedSequence, setSelectedSequence] = useState<string | null>(null);
  const [editingSequence, setEditingSequence] = useState<Sequence>({
    sequence_name: "",
    description: "",
    trigger_event: "ambassador_signup",
    is_active: true,
    steps: []
  });

  // Fetch sequences
  const { data: sequences = [] } = useQuery({
    queryKey: ["email-sequences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_sequences")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch templates for dropdown
  const { data: templates = [] } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("id, name")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    }
  });

  // Fetch steps for selected sequence
  const { data: steps = [] } = useQuery({
    queryKey: ["sequence-steps", selectedSequence],
    queryFn: async () => {
      if (!selectedSequence) return [];
      const { data, error } = await supabase
        .from("email_sequence_steps")
        .select("*")
        .eq("sequence_id", selectedSequence)
        .order("step_order");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSequence
  });

  // Save sequence mutation
  const saveSequence = useMutation({
    mutationFn: async (sequence: Sequence) => {
      if (sequence.id) {
        // Update existing
        const { error: seqError } = await supabase
          .from("email_sequences")
          .update({
            sequence_name: sequence.sequence_name,
            description: sequence.description,
            trigger_event: sequence.trigger_event,
            is_active: sequence.is_active
          })
          .eq("id", sequence.id);
        if (seqError) throw seqError;

        // Delete old steps
        await supabase
          .from("email_sequence_steps")
          .delete()
          .eq("sequence_id", sequence.id);

        // Insert new steps
        if (sequence.steps.length > 0) {
          const { error: stepsError } = await supabase
            .from("email_sequence_steps")
            .insert(
              sequence.steps.map(step => ({
                sequence_id: sequence.id,
                template_id: step.template_id,
                step_order: step.step_order,
                delay_days: step.delay_days,
                delay_hours: step.delay_hours,
                send_time: step.send_time
              }))
            );
          if (stepsError) throw stepsError;
        }

        return sequence.id;
      } else {
        // Create new
        const { data: newSeq, error: seqError } = await supabase
          .from("email_sequences")
          .insert({
            sequence_name: sequence.sequence_name,
            description: sequence.description,
            trigger_event: sequence.trigger_event,
            is_active: sequence.is_active
          })
          .select()
          .single();
        if (seqError) throw seqError;

        // Insert steps
        if (sequence.steps.length > 0) {
          const { error: stepsError } = await supabase
            .from("email_sequence_steps")
            .insert(
              sequence.steps.map(step => ({
                sequence_id: newSeq.id,
                template_id: step.template_id,
                step_order: step.step_order,
                delay_days: step.delay_days,
                delay_hours: step.delay_hours,
                send_time: step.send_time
              }))
            );
          if (stepsError) throw stepsError;
        }

        return newSeq.id;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-sequences"] });
      queryClient.invalidateQueries({ queryKey: ["sequence-steps"] });
      toast.success("Sequence saved successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to save sequence: ${error.message}`);
    }
  });

  const addStep = () => {
    setEditingSequence(prev => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          template_id: null,
          step_order: prev.steps.length + 1,
          delay_days: 0,
          delay_hours: 0,
          send_time: "08:00:00"
        }
      ]
    }));
  };

  const removeStep = (index: number) => {
    setEditingSequence(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((step, i) => ({
        ...step,
        step_order: i + 1
      }))
    }));
  };

  const updateStep = (index: number, field: keyof SequenceStep, value: any) => {
    setEditingSequence(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const loadSequence = (sequenceId: string) => {
    const sequence = sequences.find(s => s.id === sequenceId);
    if (sequence) {
      setSelectedSequence(sequenceId);
      setEditingSequence({
        id: sequence.id,
        sequence_name: sequence.sequence_name,
        description: sequence.description || "",
        trigger_event: sequence.trigger_event,
        is_active: sequence.is_active,
        steps: []
      });
    }
  };

  const createNew = () => {
    setSelectedSequence(null);
    setEditingSequence({
      sequence_name: "",
      description: "",
      trigger_event: "ambassador_signup",
      is_active: true,
      steps: []
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Email Sequences</h3>
          <p className="text-sm text-muted-foreground">Create automated email drip campaigns</p>
        </div>
        <Button onClick={createNew}>
          <Plus className="w-4 h-4 mr-2" />
          New Sequence
        </Button>
      </div>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList>
          <TabsTrigger value="builder">
            <Mail className="w-4 h-4 mr-2" />
            Builder
          </TabsTrigger>
          <TabsTrigger value="existing">
            <Send className="w-4 h-4 mr-2" />
            Existing Sequences
          </TabsTrigger>
          <TabsTrigger value="active-users">
            <Users className="w-4 h-4 mr-2" />
            Active Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sequence Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sequence Name</Label>
                <Input
                  value={editingSequence.sequence_name}
                  onChange={(e) => setEditingSequence(prev => ({ ...prev, sequence_name: e.target.value }))}
                  placeholder="e.g., Ambassador Welcome Series"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingSequence.description}
                  onChange={(e) => setEditingSequence(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this sequence does..."
                />
              </div>

              <div className="space-y-2">
                <Label>Trigger Event</Label>
                <Select
                  value={editingSequence.trigger_event}
                  onValueChange={(value) => setEditingSequence(prev => ({ ...prev, trigger_event: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambassador_signup">Ambassador Signup</SelectItem>
                    <SelectItem value="first_conversion">First Conversion</SelectItem>
                    <SelectItem value="tier_upgrade">Tier Upgrade</SelectItem>
                    <SelectItem value="payout_approved">Payout Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingSequence.is_active}
                  onCheckedChange={(checked) => setEditingSequence(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Active</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Steps</CardTitle>
              <CardDescription>Define the timing and content of each email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingSequence.steps.map((step, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Step {step.step_order}</h4>
                    <Button variant="ghost" size="sm" onClick={() => removeStep(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email Template</Label>
                      <Select
                        value={step.template_id || undefined}
                        onValueChange={(value) => updateStep(index, "template_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Send Time</Label>
                      <Input
                        type="time"
                        value={step.send_time}
                        onChange={(e) => updateStep(index, "send_time", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Delay (Days)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={step.delay_days}
                        onChange={(e) => updateStep(index, "delay_days", parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Delay (Hours)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={step.delay_hours}
                        onChange={(e) => updateStep(index, "delay_hours", parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full" onClick={addStep}>
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </CardContent>
          </Card>

          <Button onClick={() => saveSequence.mutate(editingSequence)} disabled={saveSequence.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {saveSequence.isPending ? "Saving..." : "Save Sequence"}
          </Button>
        </TabsContent>

        <TabsContent value="existing">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {sequences.map(sequence => (
                  <div
                    key={sequence.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => loadSequence(sequence.id)}
                  >
                    <div>
                      <h4 className="font-medium">{sequence.sequence_name}</h4>
                      <p className="text-sm text-muted-foreground">{sequence.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sequence.is_active ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Inactive</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active-users">
          <ActiveUsersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Active Users Tab Component
const ActiveUsersTab = () => {
  const [selectedSequence, setSelectedSequence] = useState<string | null>(null);
  
  const { data: sequences = [] } = useQuery({
    queryKey: ["email-sequences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_sequences")
        .select("id, sequence_name")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    }
  });

  const { data: activeUsers, isLoading } = useQuery({
    queryKey: ["sequence-progress", selectedSequence],
    queryFn: async () => {
      let query = supabase
        .from("email_sequence_progress")
        .select(`
          *,
          profiles(display_name, user_id),
          email_sequences(sequence_name)
        `)
        .eq("completed", false)
        .order("next_send_at");

      if (selectedSequence) {
        query = query.eq("sequence_id", selectedSequence);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: true
  });

  const pauseSequence = async (progressId: string) => {
    const { error } = await supabase
      .from("email_sequence_progress")
      .update({ next_send_at: null })
      .eq("id", progressId);

    if (error) {
      toast.error("Failed to pause sequence");
    } else {
      toast.success("Sequence paused");
    }
  };

  const resumeSequence = async (progressId: string, currentStep: number) => {
    // Calculate next send time (immediate + 1 hour)
    const nextSendAt = new Date();
    nextSendAt.setHours(nextSendAt.getHours() + 1);

    const { error } = await supabase
      .from("email_sequence_progress")
      .update({ next_send_at: nextSendAt.toISOString() })
      .eq("id", progressId);

    if (error) {
      toast.error("Failed to resume sequence");
    } else {
      toast.success("Sequence resumed");
    }
  };

  const resetSequence = async (progressId: string) => {
    const { error } = await supabase
      .from("email_sequence_progress")
      .update({ 
        current_step: 0, 
        completed: false,
        next_send_at: new Date(Date.now() + 60000).toISOString() // 1 minute from now
      })
      .eq("id", progressId);

    if (error) {
      toast.error("Failed to reset sequence");
    } else {
      toast.success("Sequence reset");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Email Sequences</CardTitle>
        <CardDescription>Monitor and manage users in email sequences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Label>Filter by sequence:</Label>
          <Select value={selectedSequence || "all"} onValueChange={(v) => setSelectedSequence(v === "all" ? null : v)}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sequences</SelectItem>
              {sequences.map(seq => (
                <SelectItem key={seq.id} value={seq.id}>{seq.sequence_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : !activeUsers || activeUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No active sequences found
          </div>
        ) : (
          <div className="space-y-2">
            {activeUsers.map((progress: any) => (
              <div key={progress.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{progress.profiles?.display_name || "Unknown User"}</p>
                  <p className="text-sm text-muted-foreground">
                    {progress.email_sequences?.sequence_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current step: {progress.current_step + 1} • 
                    {progress.next_send_at ? (
                      <> Next email: {format(new Date(progress.next_send_at), "PPp")}</>
                    ) : (
                      <span className="text-yellow-600"> Paused</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {progress.next_send_at ? (
                    <Button size="sm" variant="outline" onClick={() => pauseSequence(progress.id)}>
                      Pause
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => resumeSequence(progress.id, progress.current_step)}>
                      Resume
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => resetSequence(progress.id)}>
                    Reset
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};


