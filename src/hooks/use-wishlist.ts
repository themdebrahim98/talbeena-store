"use client";

import { useSyncExternalStore, useTransition, useCallback } from "react";
import { toast } from "@/components/primitives/toast";
import { toggleWishlistAction, removeFromWishlistAction } from "@/actions/wishlist";

interface WishlistStoreState {
  items: string[];
  isAuthenticated: boolean | null;
  isLoaded: boolean;
}

let currentState: WishlistStoreState = {
  items: [],
  isAuthenticated: null,
  isLoaded: false,
};

let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): WishlistStoreState {
  return currentState;
}

const getServerSnapshot = (): WishlistStoreState => ({
  items: [],
  isAuthenticated: null,
  isLoaded: false,
});

let isFetching = false;
function loadWishlistFromDatabase() {
  if (currentState.isLoaded || isFetching || typeof window === "undefined") return;
  isFetching = true;

  fetch("/api/wishlist", { headers: { "Cache-Control": "no-cache" } })
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { isAuthenticated?: boolean; items?: string[] } | null) => {
      if (data) {
        currentState = {
          items: data.items ?? [],
          isAuthenticated: data.isAuthenticated ?? false,
          isLoaded: true,
        };
      } else {
        currentState = {
          ...currentState,
          isLoaded: true,
        };
      }
      emitChange();
    })
    .catch(() => {
      currentState = {
        ...currentState,
        isLoaded: true,
      };
      emitChange();
    })
    .finally(() => {
      isFetching = false;
    });
}

export function useWishlist() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isPending, startTransition] = useTransition();

  // Trigger lazy background fetch if not loaded yet
  if (!state.isLoaded && typeof window !== "undefined") {
    loadWishlistFromDatabase();
  }

  const isWishlisted = useCallback(
    (productId: string) => state.items.includes(productId),
    [state.items],
  );

  const toggleWishlist = (productId: string, productName = "Product") => {
    startTransition(async () => {
      if (state.isAuthenticated === false) {
        toast.error("Please sign in to save items to your wishlist.");
        return;
      }

      const previouslyWishlisted = state.items.includes(productId);
      const previousItems = state.items;
      const optimistic = previouslyWishlisted
        ? state.items.filter((id) => id !== productId)
        : [...state.items, productId];

      // Optimistic instant UI update
      currentState = {
        ...currentState,
        items: optimistic,
      };
      emitChange();

      if (previouslyWishlisted) {
        toast.info(`Removed ${productName} from wishlist`);
      } else {
        toast.success(`Saved ${productName} to wishlist`);
      }

      try {
        const result = await toggleWishlistAction(productId);
        if (!result.success) {
          // Rollback
          currentState = {
            ...currentState,
            items: previousItems,
            isAuthenticated: result.requiresAuth ? false : currentState.isAuthenticated,
          };
          emitChange();

          if (result.requiresAuth) {
            toast.error("Please sign in to save items to your wishlist.");
          } else {
            toast.error(result.error || "Failed to update wishlist.");
          }
        } else if (result.isWishlisted !== undefined) {
          const confirmed = result.isWishlisted
            ? Array.from(new Set([...previousItems.filter((id) => id !== productId), productId]))
            : previousItems.filter((id) => id !== productId);

          currentState = {
            ...currentState,
            items: confirmed,
            isAuthenticated: true,
          };
          emitChange();
        }
      } catch {
        currentState = {
          ...currentState,
          items: previousItems,
        };
        emitChange();
        toast.error("Network error updating wishlist. Please try again.");
      }
    });
  };

  const removeItem = (productId: string, productName = "Product") => {
    startTransition(async () => {
      const previousItems = state.items;
      const optimistic = state.items.filter((id) => id !== productId);
      currentState = {
        ...currentState,
        items: optimistic,
      };
      emitChange();
      toast.info(`Removed ${productName} from wishlist`);

      try {
        const result = await removeFromWishlistAction(productId);
        if (!result.success) {
          currentState = {
            ...currentState,
            items: previousItems,
          };
          emitChange();
          toast.error(result.error || "Failed to remove item.");
        }
      } catch {
        currentState = {
          ...currentState,
          items: previousItems,
        };
        emitChange();
      }
    });
  };

  return {
    items: state.items,
    count: state.items.length,
    isWishlisted,
    toggleWishlist,
    removeItem,
    refreshWishlist: loadWishlistFromDatabase,
    isPending,
    isLoaded: state.isLoaded,
    isAuthenticated: state.isAuthenticated,
  };
}
