import { requireOwner } from "@/lib/auth/session";

export async function getOwnerId() {
  const owner = await requireOwner();
  return owner.id;
}
