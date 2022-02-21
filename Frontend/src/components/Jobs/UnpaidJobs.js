import React, { useEffect, useState } from 'react';
import axios from 'axios'
import Moment from 'moment'
import '../../App.css';

const Contracts = () => {
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        getUnpaidJobs()
    }, [])

    const getUnpaidJobs = async () => {
        const resp = await axios.get('http://localhost:3001/jobs/unpaid');
        await setJobs(resp.data)
    }

    return (
        <div className="parent">
            {
                jobs.map(job => {
                    return (
                        <div className="child" key={job.id}>
                            <div className="content">
                                <h4 className="ui sub header">{job.Contract.terms}</h4>
                                <div className="ui small feed">
                                    <div className="event">
                                        <div className="content">
                                            <div className="summary">
                                                <strong>ID: </strong>{job.id}
                                            </div>
                                            <div className="summary">
                                                <strong>Price: </strong>{job.price}
                                            </div>
                                            <div className="summary">
                                                <strong>Status: </strong>{job.Contract.status}
                                            </div>
                                            <div className="summary">
                                                <strong>Created At: </strong>{Moment(job.createdAt).format('YYYY-MM-DD')}
                                            </div>
                                            <div className="summary">
                                                <strong>Updated At: </strong>{Moment(job.updatedAt).format('YYYY-MM-DD')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        //</Link>
                    )
                })
            }
        </div>
    )
}

export default Contracts