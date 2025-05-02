import React from "react";
import { Input } from "@/components/ui/input";

interface TimeFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const TimeField: React.FC<TimeFieldProps> = ({ value, onChange, disabled }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <Input
      type="time"
      value={value}
      onChange={handleChange}
      disabled={disabled}
    />
  );
};