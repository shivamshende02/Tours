"use client";

import { useState, useEffect } from "react";

export function TypewriterHeading({ texts }: { texts: string[] }) {
  const [text, setText] = useState("");
  const [loopIndex, setLoopIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[loopIndex % texts.length];
    let typingSpeed = isDeleting ? 50 : 120;

    const handleTyping = () => {
      if (!isDeleting && text.length < currentText.length) {
        setText(currentText.slice(0, text.length + 1));
      } else if (isDeleting && text.length > 0) {
        setText(currentText.slice(0, text.length - 1));
      } else if (!isDeleting && text.length === currentText.length) {
        setTimeout(() => setIsDeleting(true), 1200); // pause at end
        return;
      } else if (isDeleting && text.length === 0) {
        setIsDeleting(false);
        setLoopIndex((prev) => prev + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopIndex, texts]);

  return (
    <h2 className="w-full text-center font-heading font-bold text-3xl md:text-4xl lg:text-5xl  mb-4">
      {text}
      <span className="border-r-2 border-primary animate-pulse ml-1" /> {/* cursor */}
    </h2>
  );
}
