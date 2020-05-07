var express = require("express");
var router = express.Router();
var multer = require("multer");
var QRCode = require("qrcode");
var helper = require("./../helpers/helper");
var keyConfig = require("./../config");
var QrCode = require("qrcode-reader");
const { check, validationResult } = require("express-validator");
var nodemailer = require("nodemailer");
const xoauth2 = require("xoauth2");
var Jimp = require("jimp");
var upload = multer({
  dest: "uploads/"
});
const fs = require("fs");

router.get("/", function(req, res, next) {
  //console.log("aaa");
  //const errors = validationResult(req);
  //console.log(errors.mapped());
  console.log("agag");
  //console.log(Math.floor(Math.random() * (9999 - 1000) + 1000));
  res.render("index", {
    JWTData: req.JWTData
  });
});

router.get("/votecandidate", function(req, res, next) {
  if (!req.cookies.votePayload) {
    return res.redirect("/vote");
  }

  var id = req.cookies.votePayload.id;
  var constituency = req.cookies.votePayload.constituency;
  var name = req.cookies.votePayload.name;
  var aadhaar = req.cookies.votePayload.aadhaar;

  res.clearCookie("votePayload");

  req.app.db.models.Candidate.find(
    {
      constituency: constituency
    },
    function(err, data) {
      if (err) {
        console.log(err);
        return next(err);
      }
      res.render("votecandidate", {
        JWTData: req.JWTData,
        data: data,
        id: id,
        constituency: constituency,
        name: name,
        aadhaar: aadhaar
      });
    }
  );
});

router.get("/vote", function(req, res, next) {
  res.render("vote", {
    JWTData: req.JWTData
  });
});

router.get("/register", function(req, res, next) {
  res.render("register", {
    JWTData: req.JWTData
  });
});

router.get("/results", function(req, res, next) {
  //modified
  req.app.db.models.Candidate.find({}, function(err, candidates) {
    if (err) {
      console.log(err);
      return next(err);
    }
    var k = [0, 1];
    return res.render("results", {
      JWTData: req.JWTData,
      candidates: candidates,
      k: k
    });
    //end
    // res.render("results", {
    //   JWTData: req.JWTData
  });
});

router.get("/test", function(req, res, next) {
  helper.test(5, function(data) {
    res.send(data.toString());
  });
});

router.post(
  "/register",
  upload.single("avatar"),
  [
    check("name", "invalid name") //input Validation
      .not()
      .isEmpty(),
    check("aadhaar", "Invalid")
      .isNumeric()
      .isLength({ min: 12 })
  ],
  function(req, res, next) {
    console.log("sgdgfg");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //if Input Is not Valid
      // console.log("lljfjf");
      console.log(errors.mapped());
      console.log("aaa");
      console.log(errors.mapped().name.msg);
      return res.render("message", {
        message: errors.mapped().name.msg,
        error: errors.mapped()
      });
    }
    console.log("afsfgs");
    var voterDetails = {
      name: req.body.name,
      mailid: req.body.mailid,
      contact: req.body.contact,
      aadhaar: req.body.aadhaar,
      image: req.body.avatar,
      hasVoted: false,
      isValid: false,
      constituency: req.body.constituency
    };

    console.log(voterDetails);
    console.log("SUnny");
    var base64Data = req.body.avatar.replace(/^data:image\/png;base64,/, "");
    console.log(base64Data);
    var name = req.body.mailid;
    var a;
    fs.writeFile("uploads/out.png", base64Data, "base64", function(err) {
      if (err) {
        console.log("aaaaa");
        console.log(err);
      } else {
        //res.send(JSON.stringify({'status': 1, 'msg': 'Image Uploaded'}));
        //console.log(out.png);

        console.log("Goof");
      }
    });
    console.log(a);

    req.app.db.models.Voter.create(voterDetails, function(err, data) {
      if (err) {
        console.log(err);
        return next(err);
      }

      var voterID = JSON.stringify(data._id);

      QRCode.toDataURL(voterID, function(err, url) {
        // console.log(url);
        var im = url.split(",")[1];
        var img = new Buffer(im, "base64");

        res.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": img.length,
          "Content-Disposition": 'attachment; filename="Voter_QR.png"'
        });
        // //modified
        // var emailMessage = `Hi ${req.body.name},\n\nThank you for registering with us.\n\nYour aadhar no is: ${req.body.aadhaar}.\n\nYour enquiry is$: \n.`;
        // console.log(emailMessage);

        // var transporter = nodemailer.createTransport({
        //   service: "gmail",
        //   auth: {
        //     user: "sunnyrathod30081@gmail.com",
        //     pass: "8796330841"
        //   }
        // });

        // var emailOptions = {
        //   from: "Sunny <sunnyrathod30081@gmail.com>",
        //   to: req.body.mailid,
        //   subject: "Node Mailer Test",
        //   text: emailMessage,
        //   attachments: [
        //     {
        //       filename: data.img + ".png",
        //       contentType: "image/png",
        //       filename: "Voter_QR",
        //       content: new Buffer.from(url.split("base64,")[1], "base64")
        //     }
        //   ]
        // };

        // transporter.sendMail(emailOptions, (err, info) => {
        //   if (err) {
        //     console.log("Hers");
        //     console.log(err);
        //     res.redirect("/");
        //   } else {
        //     console.log("aaa");
        //     console.log("Message Sent: " + info.response);
        //     console.log("Email Message: " + emailMessage);
        //     //res.redirect('/');
        //   }
        // });
        //end
        res.end(img);
      });
    });
  }
);

router.post("/verifyvoter", upload.any(), function(req, res, next) {
  var qr_uri = req.body.qrdata;
  var avatar_uri = req.body.avatar;
  var otp = Math.floor(Math.random() * (9999 - 1000) + 1000);
  console.log(otp);
  var qr = new QrCode();
  var face1, face2;
  var id;
  var name;
  console.log("ABCS");
  console.log(qr_uri === null);
  console.log(avatar_uri === null);
  // var buffer = new Buffer(qr_uri.split(",")[1], "base64");
  //var buff = new Buffer();
  const Buffer = require("safer-buffer").Buffer;
  var stri = qr_uri.split(",")[1];
  var buffer = Buffer.from(stri, "base64");

  console.log(buffer === null);
  console.log("entered");

  Jimp.read(buffer, function(err, image) {
    if (err) {
      console.error(err);
      // TODO handle error
    }

    qr.callback = function(err, value) {
      if (err) {
        console.error(err);
        // TODO handle error
      }

      id = value.result.substr(1).slice(0, -1);
      name = value.result.substr(3).slice(0, -1);

      req.app.db.models.Voter.findById(id, function(err, data) {
        if (err) {
          console.log(err);
        }
        var emailMessage = `Hi ${data.name},\n\nThank you for registering with us.\n\nYour otp is: ${otp}.\n`;
        console.log(emailMessage);

        var transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "sunnyrathod30081@gmail.com",
            pass: "8796330841"
          }
        });

        var emailOptions = {
          from: "Sunny <sunnyrathod30081@gmail.com>",
          to: data.mailid,
          subject: "Node Mailer Test",
          text: emailMessage
        };

        transporter.sendMail(emailOptions, (err, info) => {
          if (err) {
            console.log("Hers");
            console.log(err);
            res.redirect("/");
          } else {
            console.log("aaa");
            console.log("Message Sent: " + info.response);
            console.log("Email Message: " + emailMessage);
            //res.redirect('/');
          }
        });
        if (data.hasVoted == true || data.isValid == false) {
          // if (false) {
          console.log(qr_uri === null);
          return res.render("message", {
            message: "Sorry! You are not allowed to vote.",
            JWTData: req.JWTData
          });
        } else {
          // console.log("sghshhsg");
          // console.log(data.name);
          // console.log("Entered here");
          // var voteUrl = "/votecandidate";
          // var votePayload = {
          //   id: id,
          //   constituency: data.constituency,
          //   name: data.name,
          //   aadhaar: data.aadhaar
          // };

          // res.cookie("votePayload", votePayload);

          //return res.redirect(voteUrl);
          //console.log(data.image);

          helper.sendImageToMicrosoftDetectEndPoint(data.image, function(
            responseA
          ) {
            console.log(responseA);
            console.log("1");
            responseA = JSON.parse(responseA);
            console.log(responseA.length);
            if (responseA.length == 0) {
              return res.render("message", {
                message: "Face verification failed. Try again",
                JWTData: req.JWTData
              });
            }

            console.log(responseA[0].faceId);
            console.log("2");
            face1 = responseA[0].faceId;

            helper.sendImageToMicrosoftDetectEndPoint(avatar_uri, function(
              responseB
            ) {
              console.log(responseB);
              responseB = JSON.parse(responseB);
              if (responseB.length == 0) {
                return res.render("message", {
                  message: "Face verification failed. Try again",
                  JWTData: req.JWTData
                });
              }
              face2 = responseB[0].faceId;

              var payload = JSON.stringify({
                faceId1: face1,
                faceId2: face2
              });

              helper.sendImageToMicrosoftVerifyEndPoint(payload, function(
                response
              ) {
                console.log(response);
                response = JSON.parse(response);
                if (response.isIdentical == true) {
                  var voteUrl = "/votecandidate";

                  var votePayload = {
                    id: id,
                    constituency: data.constituency,
                    name: data.name,
                    aadhaar: data.aadhaar
                  };

                  res.cookie("votePayload", votePayload);

                  return res.redirect(voteUrl);
                } else {
                  return res.render("message", {
                    message: "Face verification failed. Try again",
                    JWTData: req.JWTData
                  });
                }
              });
            });
          });
        }
      });
    };
    qr.decode(image.bitmap);
  });
});

router.get("/voteadded/:id", function(req, res, next) {
  req.app.db.models.Voter.findById(req.params.id, function(err, data) {
    if (err) {
      console.log(err);
      return next(err);
    }
    data.hasVoted = true;

    data.save();

    return res.redirect("/");
  });
});

module.exports = router;
