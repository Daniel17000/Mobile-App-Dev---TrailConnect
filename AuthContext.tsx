import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useEffect, useState } from "react";

type User = {
  name: string;
  email: string;
  password: string;
};

export type Hike = {
  id: string;
  userEmail: string;
  date: string;
  duration: number;
  distanceKm: number;
  elevationGain: number;
  path: { latitude: number; longitude: number }[];
  title?: string;
};

export type Post = {
  id: string;
  text: string;
  image?: string;
};

export type AuthContextType = {
  user: User | null;
  hikes: Hike[];
  forumPosts: Post[];
  badges: string[];
  signUp: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addHike: (hike: Omit<Hike, "id" | "date">) => Promise<void>;
  getHikesByEmail: (email: string) => Promise<Hike[]>;
  deleteHike: (id: string) => Promise<void>;
  renameHike: (id: string, newTitle: string) => Promise<void>;
  refreshForumPosts: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  hikes: [],
  forumPosts: [],
  badges: [],
  signUp: async () => {},
  login: async () => false,
  logout: () => {},
  addHike: async () => {},
  getHikesByEmail: async () => [],
  deleteHike: async () => {},
  renameHike: async () => {},
  refreshForumPosts: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hikes, setHikes] = useState<Hike[]>([]);
  const [forumPosts, setForumPosts] = useState<Post[]>([]);

  // Load user + hikes + forum posts on app start
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("loggedInUser");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);

        const userHikes = await getHikesByEmail(parsed.email);
        setHikes(userHikes);
      }
    };

    const loadForumPosts = async () => {
      const saved = await AsyncStorage.getItem("forumPosts");
      if (saved) setForumPosts(JSON.parse(saved));
    };

    loadUser();
    loadForumPosts();
  }, []);

  const refreshForumPosts = async () => {
    const saved = await AsyncStorage.getItem("forumPosts");
    if (saved) setForumPosts(JSON.parse(saved));
  };

  const signUp = async (name: string, email: string, password: string) => {
    const newUser = { name, email, password };
    await AsyncStorage.setItem("registeredUser", JSON.stringify(newUser));
    await AsyncStorage.setItem("loggedInUser", JSON.stringify(newUser));
    setUser(newUser);
    setHikes([]);
  };

  const login = async (email: string, password: string) => {
    const stored = await AsyncStorage.getItem("registeredUser");
    if (stored) {
      const userData: User = JSON.parse(stored);
      if (userData.email === email && userData.password === password) {
        setUser(userData);
        await AsyncStorage.setItem("loggedInUser", JSON.stringify(userData));

        const userHikes = await getHikesByEmail(userData.email);
        setHikes(userHikes);

        return true;
      }
    }
    return false;
  };

  const logout = async () => {
    await AsyncStorage.removeItem("loggedInUser");
    setUser(null);
    setHikes([]);
    setForumPosts([]);
  };

  const readAllHikes = async (): Promise<Hike[]> => {
    const stored = await AsyncStorage.getItem("hikes");
    if (!stored) return [];
    try {
      return JSON.parse(stored) as Hike[];
    } catch {
      return [];
    }
  };

  const addHike = async (hikePartial: Omit<Hike, "id" | "date">) => {
    const all = await readAllHikes();

    const newHike: Hike = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...hikePartial,
    };

    const updated = [newHike, ...all];
    await AsyncStorage.setItem("hikes", JSON.stringify(updated));

    setHikes((prev) => [newHike, ...prev]);
  };

  const getHikesByEmail = async (email: string) => {
    const all = await readAllHikes();
    return all.filter((h) => h.userEmail === email);
  };

  const deleteHike = async (id: string) => {
    const all = await readAllHikes();
    const updated = all.filter((h) => h.id !== id);
    await AsyncStorage.setItem("hikes", JSON.stringify(updated));
    setHikes(updated);
  };

  const renameHike = async (id: string, newTitle: string) => {
    const all = await readAllHikes();
    const updated = all.map((h) =>
      h.id === id ? { ...h, title: newTitle } : h
    );
    await AsyncStorage.setItem("hikes", JSON.stringify(updated));
    setHikes(updated);
  };

  // Badge Logic
  const totalDistance = hikes.reduce((sum, h) => sum + h.distanceKm, 0);

  const badges: string[] = [];

  if (hikes.length >= 1) badges.push("Trail Newbie");
  if (hikes.length >= 5) badges.push("Trail Explorer");
  if (hikes.length >= 20) badges.push("Trail Master");

  if (totalDistance >= 10) badges.push("Distance Walker");
  if (totalDistance >= 50) badges.push("Distance Adventurer");
  if (totalDistance >= 200) badges.push("Distance Legend");

  if (forumPosts.length >= 1) badges.push("Forum Starter");
  if (forumPosts.length >= 5) badges.push("Forum Contributor");
  if (forumPosts.length >= 20) badges.push("Forum Champion");

  return (
    <AuthContext.Provider
      value={{
        user,
        hikes,
        forumPosts,
        badges,
        signUp,
        login,
        logout,
        addHike,
        getHikesByEmail,
        deleteHike,
        renameHike,
        refreshForumPosts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};




