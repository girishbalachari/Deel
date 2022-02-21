import React, { useEffect, useState } from "react";
import axios from "axios";
import Moment from "moment";
import history from "../../history";
import "../../App.css";

const Contracts = () => {
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    getContracts();
  }, []);

  const getContracts = async () => {
    const resp = await axios.get("http://localhost:3001/contracts");
    await setContracts(resp.data);
  };

  const goDetail = (contract) => {
    const to = `/contracts/${contract.id}`;
    history.push(to);
  };

  return (
    <div className="parent">
      {contracts.map((contract) => {
        return (
          <div className="child" key={contract.id}>
            <div className="content">
              <h4 className="ui sub header">{contract.terms}</h4>
              <div className="ui small feed">
                <div className="event">
                  <div className="content">
                    <div className="summary">
                      <strong>Client: </strong>
                      {contract.Client.firstName} {contract.Client.lastName}
                    </div>
                    <div className="summary">
                      <strong>Contractor: </strong>
                      {contract.Contractor.firstName}{" "}
                      {contract.Contractor.lastName}
                    </div>
                    <div className="summary">
                      <strong>Status: </strong>
                      {contract.status}
                    </div>
                    <div className="summary">
                      <strong>Created At: </strong>
                      {Moment(contract.createdAt).format("YYYY-MM-DD")}
                    </div>
                    <div className="summary">
                      <strong>Updated At: </strong>
                      {Moment(contract.updatedAt).format("YYYY-MM-DD")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Contracts;
