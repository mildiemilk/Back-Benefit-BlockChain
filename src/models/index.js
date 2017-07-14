import UserModel from './user';
import CompanyModel from './company';
import InsurerModel from './insurer';
import BrokerDetailModel from './brokerDetail';
import SimpleRequirementModel from './simpleRequirement';
import MasterPlanModel from './masterPlan';
import BiddingModel from './bidding';
import BiddingRelationModel from './biddingRelation';

export const User = UserModel;
export const Company = CompanyModel;
export const Insurer = InsurerModel;
export const BrokerDetail = BrokerDetailModel;
export const SimpleRequirement = SimpleRequirementModel;
export const MasterPlan = MasterPlanModel;
export const Bidding = BiddingModel;
export const BiddingRelation = BiddingRelationModel;

export default {
  User,
  Company,
  Insurer,
  BrokerDetail,
  SimpleRequirement,
  MasterPlan,
  Bidding,
  BiddingRelation,
};
