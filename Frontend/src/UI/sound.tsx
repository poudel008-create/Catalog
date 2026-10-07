import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SoundButtonProps {
  soundOn: boolean;
  setSoundOn: (value: boolean) => void;
}

const SoundButton = ({
  soundOn,
  setSoundOn,
}: SoundButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setSoundOn(!soundOn)}
      title={soundOn ? "Mute Sound" : "Turn On Sound"}
    >
      {soundOn ? (
        <Volume2 className="h-5 w-5" />
      ) : (
        <VolumeX className="h-5 w-5" />
      )}
    </Button>
  );
};

export default SoundButton;