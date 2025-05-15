"use client";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import { logoutSuccess } from "@/redux/reducer/userReducer";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";

export default function OrgDetail() {
  const { isAuth, user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    industry: "",
    companySize: "",
    city: "",
    country: "",
    yearFounded: "",
    organizationType: "",
    numberOfOffices: "",
    hrToolsUsed: "",
    hiringLevel: "",
    workModel: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingOrg, setCheckingOrg] = useState(true);

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuth) {
      router.push("/login");
    }
  }, [isAuth, router]);

  // Check if user already has an organization
  useEffect(() => {
    const checkOrganization = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) {
          router.push("/login");
          return;
        }
        setCheckingOrg(true);
        const { data } = await axios.get("/api/organization", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // If organization exists, redirect to /chart
        if (data && data._id) {
          router.replace("/chart");
        }
      } catch (err) {
        // If 404, user does not have an org yet, so stay on this page
        // If other errors, you may want to handle them
      } finally {
        setCheckingOrg(false);
      }
    };
    if (isAuth) checkOrganization();
  }, [isAuth, router]);

  if (!isAuth || checkingOrg) return null;

  const logoutHandler = () => {
    Cookies.remove("token", { path: "/" });
    dispatch(logoutSuccess());
    router.push("/login");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!form.name || !form.yearFounded) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      const token = Cookies.get("token");

      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        formData.append(key, val);
      });

      const { data } = await axios.post("/api/organization", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data?.organization) {
        dispatch({
          type: "organization/addOrganizationSuccess",
          payload: data,
        });
        router.push("/chart");
      } else {
        setError("Failed to save organization details.");
      }
    } catch (err) {
      // If user already has an organization, redirect (handles rare race condition)
      if (err.response?.data?.message === "User already has an organization") {
        router.replace("/chart");
      } else {
        setError(err.response?.data?.message || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-white py-10">
      <div className="w-full max-w-md border border-gray-200 rounded-lg shadow p-6 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to Reeorg
          </h1>
          <Button variant="destructive" onClick={logoutHandler}>
            Logout
          </Button>
        </div>
        <p className="text-gray-700 mb-6">
          Hello, <span className="font-semibold">{user?.name}</span>. Please
          fill out your organization details below.
        </p>

        {error && <div className="mb-4 text-red-600">{error}</div>}

        <form className="space-y-4 text-gray-900" onSubmit={submitHandler}>
          <div>
            <label className="block font-medium">Name *</label>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Industry *</label>
            <select
              name="industry"
              value={form.industry}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="">Select</option>
              <option>Healthcare and Social Assistance</option>
              <option>Finance and Insurance</option>
              <option>Professional, Scientific and Technical Services</option>
              <option>Information Technology (IT) and Software</option>
              <option>Telecommunications</option>
            </select>
          </div>
          <div>
            <label className="block font-medium">Company Size *</label>
            <select
              name="companySize"
              value={form.companySize}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="">Select</option>
              <option>150-300</option>
              <option>300-450</option>
              <option>450-600</option>
              <option>600-850</option>
              <option>850-1000</option>
              <option>1000+</option>
            </select>
          </div>
          <div>
            <label className="block font-medium">Headquarters Location *</label>
            <input
              name="city"
              type="text"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
              required
            />
            <input
              name="country"
              type="text"
              placeholder="Country"
              value={form.country}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Year Founded *</label>
            <input
              name="yearFounded"
              type="number"
              value={form.yearFounded}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Organization Type *</label>
            <select
              name="organizationType"
              value={form.organizationType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="">Select</option>
              <option>Private</option>
              <option>Public</option>
              <option>Non-Profit</option>
              <option>Government</option>
            </select>
          </div>
          <div>
            <label className="block font-medium">Number of Offices *</label>
            <input
              name="numberOfOffices"
              type="number"
              value={form.numberOfOffices}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
              min={0}
            />
          </div>
          <div>
            <label className="block font-medium">HR Tools Used *</label>
            <input
              name="hrToolsUsed"
              type="text"
              placeholder="e.g. BambooHR, Workday, SmartRecruiters"
              value={form.hrToolsUsed}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Hiring Level *</label>
            <select
              name="hiringLevel"
              value={form.hiringLevel}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="">Select</option>
              <option>Low</option>
              <option>Moderate</option>
              <option>High</option>
            </select>
          </div>
          <div>
            <label className="block font-medium">Work Model *</label>
            <select
              name="workModel"
              value={form.workModel}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="">Select</option>
              <option>Onsite</option>
              <option>Remote</option>
              <option>Hybrid</option>
              <option>Mixed</option>
            </select>
          </div>
          <Button
            type="submit"
            className="w-full mt-2 font-[550]"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}
