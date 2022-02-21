const express = require("express");
const bodyParser = require("body-parser");
const { sequelize, Profile } = require("./model");
const { getProfile } = require("./middleware/getProfile");
const { Op, col, fn, literal } = require("sequelize");
const app = express();
app.use(bodyParser.json());
app.set("sequelize", sequelize);
app.set("models", sequelize.models);

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Contacts ID
app.get("/contracts/:id", getProfile, async (req, res) => {
  const profile_id = req.get("profile_id");
  const { Contract } = req.app.get("models");
  const { id } = req.params;
  const contract = await Contract.findOne({ where: { id } });

  if (!contract) return res.status(404).end();
  if (
    contract.ContractorId !== parseInt(profile_id) &&
    contract.ClientId !== parseInt(profile_id)
  )
    return res.status(404).end();
  res.json(contract);
});

// Contracts

app.get("/contracts", async (req, res) => {
  const { Contract } = req.app.get("models");

  const contracts = await Contract.findAll({
    where: {
      status: {
        [Op.not]: "terminated",
      },
    },
    include: [
      { model: Profile, as: "Contractor" },
      { model: Profile, as: "Client" },
    ],
  });
  return res.json(contracts);
});

// Un Paid Jobs

app.get("/jobs/unpaid", async (req, res) => {
  const { Job, Contract } = req.app.get("models");

  const unpaidJobs = await Job.findAll({
    where: {
      paid: {
        [Op.not]: true,
      },
    },
    include: [
      {
        model: Contract,
        where: {
          status: {
            [Op.not]: "terminated",
          },
        },
      },
    ],
  });
  return res.json(unpaidJobs);
});

// Pay jobs
app.post("/jobs/:job_id/pay", async (req, res) => {
  const { Job, Contract, Profile } = req.app.get("models");
  const { job_id } = req.params;

  const theJobWillBePaid = await Job.findAll({
    where: {
      id: job_id,
    },
    include: [
      {
        model: Contract,
        include: [
          { model: Profile, as: "Contractor" },
          { model: Profile, as: "Client" },
        ],
      },
    ],
  });

  try {
    if (
      theJobWillBePaid[0].Contract.Client.balance > theJobWillBePaid[0].price
    ) {
      await Profile.increment(
        { balance: -theJobWillBePaid[0].price },
        { where: { id: theJobWillBePaid[0].Contract.ClientId } }
      );

      await Profile.increment(
        { balance: +theJobWillBePaid[0].price },
        { where: { id: theJobWillBePaid[0].Contract.ContractorId } }
      );
      return res.status(201).send("PAID successfully");
    }
  } catch (err) {
    console.log(err);
  }

  return res.json("Client balance is low to paid");
});

// User ID
app.post("/balances/deposit/:userId", async (req, res) => {
  const { Job, Contract, Profile } = req.app.get("models");
  const { userId } = req.params;
  const { deposit } = req.body;

  const totalAmount = await Job.findAll({
    attributes: [[sequelize.fn("sum", sequelize.col("price")), "total"]],
    include: [
      {
        model: Contract,
        where: {
          ClientId: userId,
        },
      },
    ],
    raw: true,
  });

  try {
    if (deposit > totalAmount[0].total * 0.25) {
      res
        .status(401)
        .send("can't deposit more than 25% the total of jobs to pay");
    } else {
      Profile.increment({ balance: +deposit }, { where: { id: userId } });
      res.status(201).send("was deposited successfully");
    }
  } catch (err) {
    console.log(err);
  }
});

// Profession jobs paid
app.get("/admin/best-profession", async (req, res) => {
  const { Job, Contract, Profile } = req.app.get("models");
  var { start, end } = req.query;

  const professions = await Job.findAll({
    where: {
      paid: true,
      paymentDate: {
        [Op.between]: [new Date(start), new Date(end)],
      },
    },
    include: [
      {
        model: Contract,
        include: [{ model: Profile, as: "Contractor", attributes: [] }],
        attributes: [],
      },
    ],
    attributes: [
      [fn("sum", col("price")), "total"],
      [col("Contract.Contractor.profession"), "profession"],
    ],
    group: [col("Contract.Contractor.profession")],
    order: [[literal("total"), "DESC"]],
  });

  return res.json(professions[0]);
});

// Client paid jobs
app.get("/admin/best-clients", async (req, res) => {
  const { Job, Contract, Profile } = req.app.get("models");
  var { start, end, limit } = req.query;

  const jobs = await Job.findAll({
    where: {
      paid: true,
      paymentDate: {
        [Op.between]: [new Date(start), new Date(end)],
      },
    },
    include: [
      {
        model: Contract,
        include: [{ model: Profile, as: "Client", attributes: [] }],
        attributes: [],
      },
    ],
    order: [["price", "DESC"]],
    attributes: [
      [col("Job.id"), "id"],
      [col("Contract.Client.firstName"), "firstName"],
      [col("Contract.Client.lastName"), "lastName"],
      "price",
    ],
    limit: limit ? limit : 2,
  });
  return res.json(jobs);
});

module.exports = app;
