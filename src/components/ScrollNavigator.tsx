
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";

interface ScrollNavigatorProps {
  targetRef: React.RefObject<HTMLElement>;
  scrollStep?: number;
  position?: "right" | "left";
}

export const ScrollNavigator = ({
  targetRef,
  scrollStep = 200,
  position = "right"
}: ScrollNavigatorProps) => {
  // Las flechas de navegación han sido deshabilitadas a petición del usuario
  return null;
};
