import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useContext } from "react";
import { AuthContext, AuthProvider } from "../context/AuthContext";
import Home from "./index";
import Map from "./Map";
import Profile from "./Profile";
import Trails from "./Trails";
import Upload from "./Upload";

const Tab = createBottomTabNavigator();

function AppTabs() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Home />; // show login/signup only
  }

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Map" component={Map} />
      <Tab.Screen name="Trails" component={Trails} />
      <Tab.Screen name="Upload" component={Upload} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
        <AppTabs />
    </AuthProvider>
  );
}
