const loginUser = async (req,res) => {

}

const checkAuth = (req, res, next) => {
    if (!req.session.userInfo) {
        req.isAuthenticated = false;
    } else {
        req.isAuthenticated = true;
    }
    next();
};

const logoutUser = async (req,res) => {

}

