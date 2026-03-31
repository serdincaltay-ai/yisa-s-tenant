-- attendance status'a 'penalized' ekle (cezalı onay)

ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
ALTER TABLE attendance ADD CONSTRAINT attendance_status_check
  CHECK (status IN ('present', 'absent', 'late', 'excused', 'penalized'));
