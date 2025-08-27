import {Response , userModel} from db.js

async function updateUserCredits() {
  // Step 1: Aggregate votes per author
  const creditsPerUser = await Response.aggregate([
    {
      $group: {
        _id: "$author",
        totalThumbsUp: { $sum: "$thumbs_up" },
        totalThumbsDown: { $sum: "$thumbs_down" },
      },
    },
    {
      $project: {
        credits: {
          $add: [
            { $multiply: ["$totalThumbsUp", 5] },  // 1 up = +5
            { $multiply: ["$totalThumbsDown", -2] } // 1 down = -2
          ],
        },
      },
    },
  ]);

  // Step 2: Update each user's credits
  for (const user of creditsPerUser) {
    await userModel.findByIdAndUpdate(user._id, { credits: user.credits });
  }

  console.log("User credits updated successfully");
};

export default updateUserCredits