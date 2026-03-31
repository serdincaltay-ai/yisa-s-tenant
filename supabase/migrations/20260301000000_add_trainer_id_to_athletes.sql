-- Add trainer_id column to athletes table for trainer assignment
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS trainer_id uuid REFERENCES public.staff(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_athletes_trainer_id ON public.athletes(trainer_id);

COMMENT ON COLUMN public.athletes.trainer_id IS 'Assigned trainer (staff member) for this athlete';
