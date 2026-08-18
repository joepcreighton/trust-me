import { User } from "@/lib/mock-data";

interface VouchAvatarsProps {
  vouchers: User[];
  isUserVouching: boolean;
  currentUserAvatar: string;
}

export function VouchAvatars({
  vouchers,
  isUserVouching,
  currentUserAvatar,
}: VouchAvatarsProps) {
  const allVouchers = isUserVouching
    ? [{ id: "ava", name: "You", avatar: currentUserAvatar }, ...vouchers]
    : vouchers;

  const shown = allVouchers.slice(0, 4);
  const remaining = allVouchers.length - shown.length;

  const names = allVouchers.map((v) =>
    v.name === "You" ? "You" : v.name.split(" ")[0]
  );

  let vouchText = "";
  if (names.length === 1) {
    vouchText = names[0];
  } else if (names.length === 2) {
    vouchText = `${names[0]} & ${names[1]}`;
  } else if (names.length === 3) {
    vouchText = `${names[0]}, ${names[1]} & ${names[2]}`;
  } else {
    vouchText = `${names[0]}, ${names[1]} + ${names.length - 2} others`;
  }

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-black/5">
      <div className="flex -space-x-2">
        {shown.map((v) => (
          <img
            key={v.id}
            src={v.avatar}
            alt={v.name}
            className="w-6 h-6 rounded-full border-2 border-white object-cover"
          />
        ))}
        {remaining > 0 && (
          <div className="w-6 h-6 rounded-full border-2 border-white bg-sage-light flex items-center justify-center">
            <span className="text-[8px] font-semibold text-sage-dark">
              +{remaining}
            </span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted">
        <span className="font-medium text-charcoal">Vouched</span> by{" "}
        {vouchText}
      </p>
    </div>
  );
}
