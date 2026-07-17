import "./../css/Landing.css";
import { Link } from "react-router-dom";

import {
    LayoutDashboard,
    TrendingUp,
    BarChart3,
    FileText,
    Bell,
    Settings,
    Search,
    ExternalLink
} from "lucide-react";

export default function Landing() {
    const students = [
        {
            id:1,
            name:"Student A",
            band:"Reading Band 3",
            last:"12 Oct 2023",
            initials:"ST"
        },

        {
            id:2,
            name:"Student B",
            band:"Reading Band 2",
            last:"14 Oct 2023",
            initials:"ST"
        },

        {
            id:3,
            name:"Student C",
            band:"Reading Band 1",
            last:"09 Oct 2023",
            initials:"ST"
        },

        {
            id:4,
            name:"Student D",
            band:"Reading Band 4",
            last:"15 Oct 2023",
            initials:"ST"
        },

        {
            id:5,
            name:"Student E",
            band:"Reading Band 3",
            last:"15 Oct 2023",
            initials:"ST"
        },

        {
            id:6,
            name:"Student F",
            band:"Reading Band 2",
            last:"15 Oct 2023",
            initials:"ST"
        }
    ];

    return(
        <div className="landing-page">

            {/* Sidebar */}
            <aside className="sidebar">
                <div className="logo-section">
                    <div className="logo-circle">DAS</div>
                    <div>
                        <h2>DAS Teacher</h2>
                        <p>Educational Professional</p>
                    </div>
                </div>

                <nav>
                    <a href="#" className="active">
                        <LayoutDashboard size={20}/>
                        <span>Dashboard</span>
                    </a>

                    {/*<a href="#">
                        <TrendingUp size={20}/>
                        <span>Progress Monitoring</span>
                    </a>*/}

                    {/*<a href="#">
                        <BarChart3 size={20}/>
                        <span>Error Pattern Analysis</span>
                    </a> */}

                    <a href="#">
                        <FileText size={20}/>
                        <span>Reports</span>
                    </a>

                    <a href="#">
                        <Bell size={20}/>
                        <span>Notifications</span>
                    </a>

                    <a href="#">
                        <Settings size={20}/>
                        <span>Settings</span>
                    </a>
                </nav>
            </aside>

            {/* Main */}
            <main className="main-content">

                {/* Top */}
                <header className="topbar">
                    <h2>DAS Assessment Portal</h2>
                    <div className="top-right">
                        <div className="teacher">
                    <span className="teacher-avatar">MF</span>
                    <span>Melissa Foo</span>
                    </div>
                    { /* <Settings size={22} className="settings-icon"/> */ }
                </div>

                </header>
                {/* Content */}
                <section className="page-content">
                    <h1>Class Overview</h1>
                    <p className="subtitle">Monitoring student progress and intervention risk levels.</p>

                    {/* Search */}
                    <div className="toolbar">
                        <div className="search-box">
                            <Search size={18}/>
                            <input type="text"placeholder="Search student..."/>
                        </div>

                        <select><option>Filter by: Class A1</option></select>
                        <button className="sheet-button">
                            <ExternalLink size={18} />Open Google Sheets</button>
                    </div>

                    {/* Cards */}
                    <div className="student-grid">
                        {
                            students.map(student=>(
                                <div className="student-card" key={student.id}>

                                    <div className="avatar">
                                        {student.initials}
                                    </div>

                                    <h3>{student.name}</h3>
                                    <p>{student.band}</p>

                                    <small>
                                        Last:
                                        <br/>
                                        {student.last}
                                    </small>

                                    <Link to={`/student/${student.id}`} className="dashboard-button">View Dashboard</Link>
                                </div>
                            ))
                        }

                        <div className="student-card add-card">
                            <div className="plus">+</div>
                            <p>Register New Student</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}