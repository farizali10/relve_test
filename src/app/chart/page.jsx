"use client";

import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getOrganization } from "@/redux/action/org";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import { logoutSuccess } from "@/redux/reducer/userReducer";

export default function ChartPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const { isAuth, user } = useSelector((state) => state.user);
  const { organization, loading, error } = useSelector(
    (state) => state.organization
  );

  // Fetch organization on mount if not loaded yet
  useEffect(() => {
    if (!isAuth) {
      router.replace("/login");
      return;
    }
    if (!organization && !loading && !error) {
      dispatch(getOrganization());
    }
  }, [isAuth, organization, loading, error, dispatch, router]);

  // If user has no organization, redirect to org creation page
  useEffect(() => {
    if (!loading && isAuth && !organization && !error) {
      router.replace("/organization");
    }
  }, [loading, isAuth, organization, error, router]);

  const logoutHandler = () => {
    Cookies.remove("token", { path: "/" });
    dispatch(logoutSuccess());
    router.push("/login");
  };

  if (!isAuth) return null;
  if (loading)
    return <p className="p-8 text-center">Loading organization data...</p>;
  if (error)
    return <p className="p-8 text-center text-red-600">Error: {error}</p>;
  if (!organization) return null;

  // Optional: Check if the org belongs to the user (should always be true if backend is correct)
  if (organization.user && user && organization.user !== user._id) {
    return <p className="p-8 text-center text-red-600">Organization not found for this user.</p>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <div className="flex justify-between items-center w-full max-w-md mb-6">
        <h1 className="text-3xl font-bold">Organization Details</h1>
        <Button variant="destructive" onClick={logoutHandler}>
          Logout
        </Button>
      </div>

      <div className="border border-gray-300 rounded-lg p-6 w-full max-w-md text-center shadow-md bg-gray-50">
        <div className="text-2xl font-semibold">
          {organization.name || "N/A"}
        </div>
        <div className="text-xl text-gray-600 mt-2">
          Founded: {organization.yearFounded || "N/A"}
        </div>
        <div className="mt-4">
          <strong>Industry:</strong> {organization.industry || "N/A"}
        </div>
        <div>
          <strong>Company Size:</strong> {organization.companySize || "N/A"}
        </div>
        <div>
          <strong>Location:</strong> {organization.city}, {organization.country}
        </div>
        <div>
          <strong>Organization Type:</strong> {organization.organizationType}
        </div>
        <div>
          <strong>Offices:</strong> {organization.numberOfOffices}
        </div>
        <div>
          <strong>HR Tools:</strong> {organization.hrToolsUsed}
        </div>
        <div>
          <strong>Hiring Level:</strong> {organization.hiringLevel}
        </div>
        <div>
          <strong>Work Model:</strong> {organization.workModel}
        </div>
      </div>
    </div>
  );
}
